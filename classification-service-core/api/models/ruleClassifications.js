/*
 * Copyright 2015-2017 Hewlett Packard Enterprise Development LP.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//represents operations that can be performed on Classification Service "Rule Classifications"
var Q = require('q');
var logger = require('../logging/logging.js');
//ERRORS
var apiErrorFactory = require('./errors/apiErrorFactory.js');
//HELPERS
var pagingHelper = require('../helpers/pagingHelper.js');
var policyApiObjectsHelper = require('../helpers/policyApiObjectsHelper.js');
var policyApiToClassificationApiHelper = require('../helpers/policyApiToClassificationApiHelper.js');
var ruleClassificationsHelper = require('../helpers/classificationObjectsHelper.js').ruleClassifications;
//CLASSIFICATION API MODELS
var classificationsModel = require('./classifications.js');
var classificationRuleConditionsModel = require('./classificationRuleConditions.js');
var validation = require('./validation.js');
//POLICY API MODELS
var collectionModel = require('./policy_api/collection.js');
var colSeqModel = require('./policy_api/collectionSequence.js');
var conditionModel = require('./policy_api/condition.js');

module.exports = {
  create: create,
  delete: deleteRuleClassification,
  deleteAll: deleteAll,
  get: get,
  getRuleClassifications: getRuleClassifications,
  update: update
};

function create(createParams){
  var deferredCreate = Q.defer();
  var ruleRootConditionId;
  var retrivedCollectionSequence;
  var builtRuleClassification;
  
  classificationRuleConditionsModel.validateAndGetRuleRootCondition(createParams.project_id, createParams.workflowId, createParams.classificationRuleId)
  .then(function(validateResult){
    logger.debug("Validated that Workflow and Classification Rule exist when creating Rule Classification. Also retrieved Classification Rule Root Condition");
    ruleRootConditionId = validateResult.rootCondition.id;
    retrivedCollectionSequence = validateResult.collectionSequence;
    
    //verify that the classification ID provided is valid
    var getClassificationParams = {
      id: createParams.classificationId,
      project_id: createParams.project_id
    };
    return classificationsModel.getClassificationConditionAndPolicy(getClassificationParams);
  })
  .then(function(retrievedClassificationObject){
    logger.debug(function(){return "Verified that Classification specified during Create Rule Classification exists.";});
    
    //create a Collection with;
    //- a fragment pointing to the Classification
    //- a fragment pointing to the Classification Rule root condition
    //- the Policy associated with the Classification
    var createCollectionParams = {
      name: ruleClassificationsHelper.buildNameFromIds(createParams.workflowId, createParams.classificationRuleId, createParams.classificationId),
      policyIds: [createParams.classificationId]
    };
    //set a boolean condition on the Collection to hold the fragments to be added
    createCollectionParams.condition = ruleClassificationsHelper.getNewRootLevelCondition();
    
    //add a fragment condition that points to the classification passed
    var classificationPointerCondition = ruleClassificationsHelper.getRuleClassificationCondition(retrievedClassificationObject.condition.id);
    //create a fragment condition pointing to the Rule level condition
    var rulePointerCondition = ruleClassificationsHelper.getRuleRootFragmentCondition(ruleRootConditionId);    
    policyApiObjectsHelper.addChildToCondition(createCollectionParams.condition, classificationPointerCondition);
    policyApiObjectsHelper.addChildToCondition(createCollectionParams.condition, rulePointerCondition);
    
    return collectionModel.create(createParams.project_id, createCollectionParams);
  })
  .then(function(createdCollection){
    logger.debug(function(){return "Created Collection to represent Rule Classification, Collection: "+createdCollection.id;});
    builtRuleClassification = policyApiToClassificationApiHelper.buildRuleClassificationFromCollectionAndClassificationId(createdCollection, null, createParams.classificationId);
    
    logger.debug(function(){return "Adding created Collection, ID: "+createdCollection.id+" as entry on the Collection Sequence ID: "+retrivedCollectionSequence.id;});    
    return colSeqModel.updateCollectionSequenceWithEntryForCollection(createParams.project_id,
      retrivedCollectionSequence, createdCollection.id, null,
      colSeqModel.defaults.updateBehaviour.add);   
  })
  .then(function(){
    logger.debug(function(){return "Updated Collection Sequence with entry for created Collection: "+builtRuleClassification.id;});
    logger.debug("Rule Classification created, ID: "+builtRuleClassification.id);
    deferredCreate.resolve(builtRuleClassification);
  })
  .fail(function(errorResponse){
    deferredCreate.reject(errorResponse);
  }).done();
  
  return deferredCreate.promise;
}

function deleteAll(deleteParams){
  var deferredDelete = Q.defer();
  
  var validateParams = {
    id: deleteParams.classificationRuleId,
    project_id: deleteParams.project_id,
    workflowId: deleteParams.workflowId
  };
  var colSeq;
  var collectionIdsToDelete = [];
  var conditionsToDelete = [];
  
  validation.validateWorkflowAndSeqForRule(validateParams)
  .then(function(validateResult){
    logger.debug("Validated that Workflow and Classification Rule exist when deleting Rule Classifications.");
    
    logger.debug("Checking Collection entries on validated Collection Sequence for Rule Classification deletion.");
    colSeq = validateResult.collectionSequence;
    ruleClassTotalHits = colSeq.additional.collection_sequence_entries.length;
    if(ruleClassTotalHits===0){
      logger.debug("No Rule Classifications to delete on the Classification Rule: "+deleteParams.classificationRuleId);
      deferredDelete.resolve({});
      return Q({complete: true});
    }
    logger.debug("Extracting Collection IDs to delete from retrieved Collection Sequence ID: "+colSeq.id);
    for(var collectionEntry of colSeq.additional.collection_sequence_entries){
      for(var collectionId of collectionEntry.collection_ids){
        collectionIdsToDelete.push(collectionId);
      }
    }
    logger.debug("Removing Collection entries from Collection Sequence: "+colSeq.id);
    policyApiObjectsHelper.removeAllCollectionEntriesFromCollectionSequence(colSeq);
    //save the collection sequence
    var updateCollectionSequenceParams = {
      additional: colSeq.additional,
      id: colSeq.id,
      name: colSeq.name,
      description: colSeq.description
    };    
    return colSeqModel.update(deleteParams.project_id, updateCollectionSequenceParams);
  })
  .then(function(updateResult){
    if(updateResult.complete===true){
      return Q({complete: true});
    }
    logger.debug("Removed Collection Entries from Collection Sequence ID: "+colSeq.id);
    //need to retrieve Collection details to get the Condition in use on each (so we can remove it later)
    logger.debug("Retrieving Collection details to get Conditions on each.");
    var getCollectionsByIdsParams = {
      ids: collectionIdsToDelete,
      includeCondition: true
    };
    return collectionModel.getCollectionsByIds(deleteParams.project_id, getCollectionsByIdsParams);
  })
  .then(function(retrievedCollections){
    logger.debug("Retrieved Collections. Extracting Condition IDs for deletion.");
        
    var updatePromises = [];
    for(var collection of retrievedCollections.results){
      var updateCollectionParams = {
        policyIds: [],
        id: collection.id,
        name: "DELETE_PLACEHOLDER"
      };
      updatePromises.push(collectionModel.update(deleteParams.project_id, updateCollectionParams));
      
      if(collection.additional.condition){
        conditionsToDelete.push(collection.additional.condition.id);
      }      
    }
    logger.debug("Updating Collections to not have references to Policies.");
    return updatePromises;
  })
  .all()
  .then(function(updateResult){
    if(updateResult.complete===true){
      return Q({complete: true});
    }
    logger.debug("Updated Collections to not refer to Policies as part of deleting Rule Classifications under Classification Rule: "+colSeq.id);
    logger.debug("Attempting to delete Collections that were part of Collection Sequence: "+colSeq.id);
    return collectionModel.deleteAll(deleteParams.project_id, collectionIdsToDelete);
  })
  .then(function(deleteResult){
    if(deleteResult.complete===true){
      return Q({complete: true});
    }
    logger.debug("Deleted Collections under Collection Sequence ID: "+deleteParams.classificationRuleId);
    return conditionModel.deleteAll(deleteParams.project_id, conditionsToDelete);
  })
  .then(function(deleteResult){
    if(deleteResult.complete===true){
      return Q({complete: true});
    }
    logger.debug("Removed Root Conditions for Rule Classifications.");
    logger.debug("Rule Classifications removed from Classification Rule.");
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

function deleteRuleClassification(deleteParams){
  var deferredDelete = Q.defer();
  var retrievedCollection;
  var conditionToDelete;
  
  deleteParams.includeCondition = true;
  
  getRuleClassificationColSeqAndCollection(deleteParams)
  .then(function(retrieveResult){
    logger.debug("Verified that Rule Classification path to delete is valid.");
    var retrievedSeq = retrieveResult.collectionSequence;
    retrievedCollection = retrieveResult.collection;
    
    logger.debug("Removing Collection Entry for the Rule Classification from the Collection Sequence.");
    policyApiObjectsHelper.removeCollectionEntryFromCollectionSequence(retrievedSeq.additional.collection_sequence_entries, deleteParams.id);
    
    var updateCollectionSequenceParams = {
      additional: retrievedSeq.additional,
      id: retrievedSeq.id,
      name: retrievedSeq.name,
      description: retrievedSeq.description
    };    
    return colSeqModel.update(deleteParams.project_id, updateCollectionSequenceParams);
  })
  .then(function(){
    logger.debug(function(){return "Removed Collection with ID: "+deleteParams.id+" from Collection Sequence: "+deleteParams.classificationRuleId;});
    
    var updateCollectionParams = {
      policyIds: [],
      id: retrievedCollection.id,
      name: "DELETE_PLACEHOLDER"
    };
    if(retrievedCollection.additional.condition){
      conditionToDelete = retrievedCollection.additional.condition.id;
    }

    logger.debug("Updating Collection to not have reference to Policy as part of delete Rule Classification with ID: "+deleteParams.id);
    return collectionModel.update(deleteParams.project_id, updateCollectionParams);
  })
  .then(function(updateResult){
    logger.debug("Updated Collection to not refer to Policy as part of deleting Rule Classifications under Classification Rule: "+deleteParams.classificationRuleId);
    logger.debug("Attempting to delete Collection: "+deleteParams.id);
    return collectionModel.delete(deleteParams.project_id, deleteParams.id);
  })
  .then(function(deleteResult){
    logger.debug("Deleted Collection under Collection Sequence ID: "+deleteParams.classificationRuleId);
    return conditionModel.delete(deleteParams.project_id, conditionToDelete);
  })
  .then(function(deleteResult){
    logger.debug("Removed Root Condition for Rule Classification ID: "+deleteParams.id);
    logger.debug("Rule Classification removed from Classification Rule.");
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();  
  
  return deferredDelete.promise;
}

//returns the Rule Classification and its associated Collection Sequence and Collection objects
function getRuleClassificationColSeqAndCollection(getParams){
  var deferredGet = Q.defer();
  
  var validateParams = {
    id: getParams.classificationRuleId,
    project_id: getParams.project_id,
    workflowId: getParams.workflowId
  };
  var colSeq;
  
  validation.validateWorkflowAndSeqForRule(validateParams)
  .then(function(validateResult){
    logger.debug("Validated that Workflow and Classification Rule exist when retrieving Rule Classification.");
    
    logger.debug("Verifying that Rule Classification is on this Classification Rule.");
    colSeq = validateResult.collectionSequence;
    var matchedRuleClassification = false;
    //iterate over collection entries to find the match for the ID requested
    for(var collectionEntry of colSeq.additional.collection_sequence_entries){
      for(var collectionId of collectionEntry.collection_ids){
        if(collectionId===getParams.id){
          matchedRuleClassification=true;
          break;
        }
      }
      if(matchedRuleClassification===true){
        break;
      }      
    }
    if(matchedRuleClassification===false){
      throw apiErrorFactory.createNotFoundError("Rule Classification ID: "+getParams.id+" not found on Classification Rule: "+getParams.classificationRuleId);
    }
    logger.debug("Retrieving details of Collection with ID: "+getParams.id+" to return associated Classification on Rule Classification.");    
    return collectionModel.get(getParams.project_id, getParams.id, getParams.includeCondition);
  })
  .then(function(retrievedCollection){
    logger.debug("Retrieved Collection with ID: "+getParams.id);
    var builtRuleClassification = policyApiToClassificationApiHelper.buildRuleClassificationFromCollection(retrievedCollection);
    deferredGet.resolve({
      collection: retrievedCollection,
      collectionSequence: colSeq,
      ruleClassification: builtRuleClassification
    });
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function get(getParams){
  var deferredGet = Q.defer();
  
  getRuleClassificationColSeqAndCollection(getParams)
  .then(function(retrieveResult){
    logger.debug("Retrieved Rule Classification with ID: "+getParams.id);
    deferredGet.resolve(retrieveResult.ruleClassification);
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function getRuleClassifications(getParams){
  var deferredGet = Q.defer();
  var ruleClassTotalHits = 0;
  
  var validateParams = {
    id: getParams.classificationRuleId,
    project_id: getParams.project_id,
    workflowId: getParams.workflowId
  };
  
  validation.validateWorkflowAndSeqForRule(validateParams)
  .then(function(validateResult){
    logger.debug("Validated that Workflow and Classification Rule exist when retrieving Rule Classifications.");
    
    logger.debug("Checking Collection entries on validated Collection Sequence for Rule Classification retrieval.");
    var colSeq = validateResult.collectionSequence;
    ruleClassTotalHits = colSeq.additional.collection_sequence_entries.length;
    if(ruleClassTotalHits===0){
      logger.debug("No Rule Classifications on the Classification Rule: "+getParams.classificationRuleId);
      deferredGet.resolve({
        ruleClassifications: [],
        totalHits: ruleClassTotalHits
      });
      return Q({complete: true});
    }
    //only retrieve as many Rule Classifications as requested by paging parameters
    var pagingParams = pagingHelper.getValidatedPagingParams(getParams.pageNum, getParams.pageSize);
    if(pagingParams.start > ruleClassTotalHits || 
      pagingParams.pageSize === 0){
      logger.debug("pageSize is zero or pageNum is beyond available number of results, no Rule Classifications well be returned for Classification Rule: "+getParams.classificationRuleId);
      //start index is greater than the number of entries or the number of Rule Classifications, return empty array.
      deferredGet.resolve({
        ruleClassifications: [],
        totalHits: ruleClassTotalHits
      });
      return Q({complete: true});
    }
    logger.debug("Extracting IDs of Collections to retrieve details for from Classification Rule: "+getParams.classificationRuleId);
    //Extract the Collection IDs that need to be queried for to get the Classification ID set on them
    var collectionIdsToGet = [];
    var collectionCounter = 0;
    for(var collectionEntry of colSeq.additional.collection_sequence_entries){
      for(var collectionId of collectionEntry.collection_ids){
        collectionCounter++;
        //only return those entries from paging start index onwards
        if(collectionCounter < pagingParams.start){
          continue;
        }
        collectionIdsToGet.push(collectionId);
        //check if we have reached page size limit, if so then no need to add any more collections to retrieve
        if(collectionIdsToGet.length === pagingParams.pageSize){
          break;
        }
      }
      if(collectionIdsToGet.length === pagingParams.pageSize){
        break;
      }      
    }
    var getWithIdsParams = {
      ids: collectionIdsToGet
    };
    logger.debug(function(){return "About to retrieve Collection details for IDs: "+collectionIdsToGet;});
    return collectionModel.getCollectionsByIds(getParams.project_id, getWithIdsParams);    
  })
  .then(function(retrievedCollections){
    if(retrievedCollections.complete===true){
      return Q({complete: true});
    }    
    logger.debug(function(){return "Retrieved Collections while retrieving Rule Classifications for Classification Rule: "+getParams.classificationRuleId;});
    var ruleClassifications = [];
    for(var collection of retrievedCollections.results){
      var builtRuleClassification = policyApiToClassificationApiHelper.buildRuleClassificationFromCollection(collection);
      logger.debug("Built Rule Classification from Collection: "+collection.id);
      ruleClassifications.push(builtRuleClassification);
    }
    deferredGet.resolve({
      ruleClassifications: ruleClassifications,
      totalHits: ruleClassTotalHits
    });
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function update(updateParams){
  var deferredUpdate = Q.defer();
  var originalCollection;
  
  getRuleClassificationColSeqAndCollection(updateParams)
  .then(function(retrieveResult){
    logger.debug("Verified that Rule Classification exists before updating.");
    originalCollection = retrieveResult.collection;
    
    logger.debug("Verifying that the classification ID provided is valid.");
    var getClassificationParams = {
      id: updateParams.updatedRuleClassification.classificationId,
      project_id: updateParams.project_id
    };
    return classificationsModel.getClassificationConditionAndPolicy(getClassificationParams);
  })
  .then(function(retrievedClassificationObject){
    logger.debug(function(){return "Verified that Classification specified during Update Rule Classification exists.";});

    var updateCollectionParams = {
      description: originalCollection.description,
      id: updateParams.id,
      name: originalCollection.name,
      policyIds: [updateParams.updatedRuleClassification.classificationId]
    };
    return collectionModel.update(updateParams.project_id, updateCollectionParams);
  })
  .then(function(updatedCollection){
    logger.debug("Updated Collection: "+updateParams.id);
    
    deferredUpdate.resolve(updatedCollection);
  })
  .fail(function(errorResponse){
    deferredUpdate.reject(errorResponse);
  }).done();
  
  return deferredUpdate.promise;
}