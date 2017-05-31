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
//represents operations that can be performed on Classification Service Classifications
var Q = require('q');
var logger = require('../logging/logging.js');
var policyModel = require('./policy_api/policy.js');
var lexiconsModel = require('./policy_api/lexicons.js');
var conditionModel = require('./policy_api/condition.js');
var classificationApiToPolicy = require('../helpers/classificationApiToPolicyHelper.js');
var policyApiToClassification = require('../helpers/policyApiToClassificationApiHelper.js');
var classificationsHelper = require('../helpers/classificationObjectsHelper.js').classifications;
var apiErrorFactory = require('./errors/apiErrorFactory.js');
var ApiError = require('./errors/apiError.js');
var apiErrorTypes = require('./errors/apiErrorTypes.js');
var pagingHelper = require('../helpers/pagingHelper.js');
var strUtils = require('../libs/stringUtils.js');

module.exports = {
  create: create,
  delete: deleteClassification,
  get: get,
  getClassificationConditionAndPolicy: getClassificationConditionAndPolicy,
  getClassifications: getClassifications,
  update: update
};

var defaultNoMatchMessage = "Unable to retrieve Classification with ID: ";
var defaultTermListsUsedNotFoundMessage = "Unable to find all Term List IDs specified in Classification.";

function getNoClassificationMatchMessage(id){
  return defaultNoMatchMessage+id;
}

function create(createParams){
  var deferredCreate = Q.defer();
  
  var builtClassification;
  //keep condition around after creation so it can be easily updated
  var conditionForUpdate;
  var createdPolicyId;
  
  //create condition before Policy as it is more likely to fail if caller provides invalid 'additional' property
  classificationApiToPolicy.updateClassificationConditionAdditionalToPolicyForm(createParams);
  classificationsHelper.markConditionAsClassification(createParams);
  
  //check that any Term Lists used in the Conditions exist
  var termListIdsToCheck = classificationsHelper.getTermListIdsOnClassification(createParams);
  var checkTermListsValidPromise;
  if(termListIdsToCheck.length===0){
    //no Term Lists in use on Classification, no need to query for Lexicons
    logger.debug("No Term Lists used in Classification to be created, no validation query required for Term Lists.");
    checkTermListsValidPromise = Q();
  }
  else{
    logger.debug("Term Lists are used in Classification to be created, checking that all specified Term Lists exist.");
    checkTermListsValidPromise  = lexiconsModel.getWithValidate(createParams.project_id, termListIdsToCheck, null, defaultTermListsUsedNotFoundMessage)
  }
  checkTermListsValidPromise.then(function(){
    logger.debug("Any Term Lists passed to use in new Classification exist.");
    
    var createConditionParams = {
      additional: createParams.additional,
      name: "CREATE_PLACEHOLDER"
    };
    return conditionModel.create(createParams.project_id, createConditionParams);
  })
  .then(function(createdCondition){
    conditionForUpdate = createdCondition;
    logger.debug("Created Condition to use for created Classification. Condition ID: "+createdCondition.id);
    
    builtClassification = policyApiToClassification.buildClassificationFromCondition(createdCondition);
    //create policy to associate with this condition
    var createPolicyParams = {
      additional: classificationApiToPolicy.getDefaultPolicyAdditionalDefinition(),
      description: classificationsHelper.buildPolicyDescriptionFromObject(createParams)
    };
    classificationsHelper.associatePolicyWithCondition(createPolicyParams, createdCondition.id);    
    return policyModel.create(createParams.project_id, createPolicyParams);
  })
  .then(function(createdPolicy){    
    //record the ID of new Policy in case there is an error updating Condition and we need to delete Policy.
    createdPolicyId = createdPolicy.id;
    logger.debug("Created Policy to use for created Classification. Policy ID: "+createdPolicyId);

    builtClassification = policyApiToClassification.buildClassificationFromPolicy(createdPolicy, builtClassification);
    //update the Condition name to refer to the created Policy
    classificationsHelper.associateConditionWithPolicy(conditionForUpdate, createdPolicy.id);
    return conditionModel.update(createParams.project_id, conditionForUpdate);
  })
  .then(function(){
    logger.debug("Associated Condition with ID: "+ conditionForUpdate.id + " & Policy with ID: " + createdPolicyId + " to represent Classification.");
    deferredCreate.resolve(builtClassification);
  })
  .fail(function(errorResponse){
    logger.error("Error occurred during creation of Classification.");
    //if failure occurred after Condition was created try to delete the Condition to avoid half created Classification
    if(conditionForUpdate!==undefined && conditionForUpdate.id){
      logger.error("Attempting to remove Condition created for Classification before error occurred.");
      conditionModel.delete(createParams.project_id, conditionForUpdate.id)
      .then(function(){
        logger.info("Deleted Condition created during Classification creation, Condition ID: "+conditionForUpdate.id);
      })
      .fail(function(conditionDeleteError){
        logger.error("Failed to delete Condition created during Classification creation, Condition ID: "+ conditionForUpdate.id +". Error: "+conditionDeleteError);
      }).done();
    }    
    //if failure occurred after Policy was created try to delete the Policy also
    if(createdPolicyId){
      logger.error("Attempting to remove Policy created for Classification before error occurred.");
      policyModel.delete(createParams.project_id, createdPolicyId)
      .then(function(){
        logger.info("Deleted Policy created during Classification creation, Policy ID: "+createdPolicyId);
      })
      .fail(function(policyDeleteError){
        logger.error("Failed to delete Policy created during Classification creation, Policy ID: "+ createdPolicyId +". Error: "+policyDeleteError);
      }).done();
    }
    
    //if the error was due to not finding Term Lists change the API Error type to invalid request. Logic of this decision is that item not found would be correct if the Term List was primary focus of request but here it is just a small part of the request and constitutes it being in an invalid state.
    if(errorResponse instanceof ApiError){
      if(errorResponse.message === defaultTermListsUsedNotFoundMessage){
        errorResponse.type = apiErrorTypes.INVALID_ARGUMENT;
      }
    }
    
    deferredCreate.reject(errorResponse);
  }).done();
    
  return deferredCreate.promise;
}

function deleteClassification(deleteParams){
  var deferredDelete = Q.defer();
  var policyDeleted = false;
  var conditionDeleted = false;
  var conditionIdToDelete;
  
  //verify that the Classification exists while also retrieving the Condition and Policy IDs for deletion
  getClassificationConditionAndPolicy(deleteParams)
  .then(function(retrievedClassificationResult){
    logger.debug("Retrieved Classification for deletion. Condition ID: "+retrievedClassificationResult.condition.id + " & Policy ID: "+retrievedClassificationResult.policy.id);    
    conditionIdToDelete = retrievedClassificationResult.condition.id;
    
    //attempt to delete the Policy first. If it is in use then delete will fail (Condition delete succeeds even when Condition in use)
    return policyModel.delete(deleteParams.project_id, deleteParams.id);
  })
  .then(function(){
    logger.debug(function(){return "Deleted Policy ID: "+deleteParams.id+" .Attempting to delete Condition with ID: "+conditionIdToDelete;});
    
    return conditionModel.delete(deleteParams.project_id, conditionIdToDelete);
  })
  .then(function(){    
    logger.debug("Condition with ID: "+conditionIdToDelete+" deleted. Classification has been deleted.");
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    //if an error occurred while trying to delete the Condition after deleting the Policy then this Classification is in an invalid state. Log out a warning about this.
    if(policyDeleted && !conditionDeleted){
      logger.warning("Policy with ID: "+deleteParams.id+ " was deleted but associated Condition was not, ID: "+conditionIdToDelete);
    }    
    
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

//builds Classification from a Policy after a retrieve with additional handling in case of error
function buildClassificationFromPolicyAfterRetrieve(retrievedPolicy, builtClassification){
  try{
    builtClassification = policyApiToClassification.buildClassificationFromPolicy(retrievedPolicy);
  }
  catch(errorThrown){
    logger.error("Failed to build Classification from Policy retrieved for ID: "+retrievedPolicy.id+", Policy: " + JSON.stringify(retrievedPolicy) + " Error: "+strUtils.getString(errorThrown));
    throw apiErrorFactory.createError("Unable to retrieve Classification for ID: "+retrievedPolicy.id);
  }
  return builtClassification;
}

//extracts condition ID from Policy after a retrieve with additional handling in case of error
function extractConditionIdFromPolicyAfterRetrieve(retrievedPolicy){
  var extractedConditionId = classificationsHelper.getConditionIdFromPolicy(retrievedPolicy);
  if(extractedConditionId===null){
    logger.error("Failed to extract Condition ID from the name of Policy with ID: "+retrievedPolicy.id+" when retrieving Classification.");
    throw apiErrorFactory.createError("Unable to retrieve Classification for ID: "+retrievedPolicy.id);
  }
  return extractedConditionId;
}

//extracts policy ID from Condition after a retrieve with additional handling in case of error
function extractPolicyIdFromConditionAfterRetrieve(retrievedCondition, classificationId){
  var extractedPolicyId = classificationsHelper.getPolicyIdFromCondition(retrievedCondition);
  if(extractedPolicyId===null){
    logger.error("Failed to extract Policy ID from the name of Condition with ID: "+retrievedCondition.id+" when retrieving Classification.");
    if(classificationId){
      throw apiErrorFactory.createError("Unable to retrieve Classification for ID: "+classificationId);
    }
    else{
      throw apiErrorFactory.createError("Unable to retrieve Classification");
    }
  }
  return extractedPolicyId;
}

function get(getParams){
  var deferredGet = Q.defer();  
  getClassificationConditionAndPolicy(getParams)
  .then(function(getClassificationResult){
    deferredGet.resolve(getClassificationResult.classification);
  })
  .fail(function(errorResponse){
    logger.error("Unable to retrieve Classification: "+strUtils.getString(errorResponse));
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

//gets a Classification for given ID and the associated Policy and Condition objects
function getClassificationConditionAndPolicy(getParams){
  var deferredGet = Q.defer();
  var returnObject = {};
  var builtClassification;
  //find Policy with ID matching specified value
  policyModel.validatePolicyExists(getParams.project_id, getParams.id, getNoClassificationMatchMessage(getParams.id))
  .then(function(retrievedPolicy){
    logger.debug("Retrieved Policy with ID: "+getParams.id+" as part of retrieving Classification.");
    returnObject.policy = retrievedPolicy;
    builtClassification = buildClassificationFromPolicyAfterRetrieve(retrievedPolicy);
    //get the condition ID from the name of the Policy
    var extractedConditionId = extractConditionIdFromPolicyAfterRetrieve(retrievedPolicy);
    return conditionModel.validateConditionExists(getParams.project_id, extractedConditionId, true);
  })
  .then(function(retrievedCondition){
    logger.debug("Retrieved Condition with ID: "+retrievedCondition.id+" as part of retrieving Classification with ID: "+getParams.id);
    builtClassification = policyApiToClassification.buildClassificationFromCondition(retrievedCondition, builtClassification);
    
    //complete build up and return of the result object.
    returnObject.condition = retrievedCondition;
    returnObject.classification = builtClassification;
    logger.debug(function(){return "Retrieved Classification: "+strUtils.getString(builtClassification);});
    deferredGet.resolve(returnObject);
  })
  .fail(function(errorResponse){
    logger.error("Unable to retrieve Classification: "+strUtils.getString(errorResponse));
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function getClassifications(getParams){
  var deferredGet = Q.defer();

  //a map of Classifications to easier lookup
  var classificationsMap = {};
  var classificationsTotalHits = 0;
  var classificationsToReturn = [];
     
  policyModel.getPolicies(getParams.project_id, getParams.pageNum, getParams.pageSize)
  .then(function(retrievedPolicies){
    logger.debug("Retrieved Policies to use in Classifications being retrieved.");
    classificationsTotalHits = retrievedPolicies.totalhits;
    if(retrievedPolicies.results.length===0){
      logger.debug("No Policies returned in results, proceeding without retrieving Conditions.");
      //promise chain flow continues but we will pass indication that no further work is required
      return Q({
        complete: true
      });
    }
    logger.debug("Building Classifications from retrieved Policies.");
    var conditionIdsToRetrieve = [];    
    for(var retrievedPolicy of retrievedPolicies.results){
      try{
        var builtClassification = buildClassificationFromPolicyAfterRetrieve(retrievedPolicy);
        var extractedConditionId = extractConditionIdFromPolicyAfterRetrieve(retrievedPolicy);
        logger.debug("Extracted Condition ID: "+extractedConditionId+" from Policy with ID: "+retrievedPolicy.id);
        conditionIdsToRetrieve.push(extractedConditionId);
        classificationsMap[builtClassification.id] = builtClassification;
        classificationsToReturn.push(builtClassification);
      }
      catch(errorThrown){
        logger.error("Error occurred while building Classifications from Policies. Invalid Policies may be in the system. Policy causing issue was: "+strUtils.getString(retrievedPolicy));
        throw apiErrorFactory.createError("Unable to retrieve Classifications");
      }
    }
    //retrieve all conditions required
    return conditionModel.validateConditionExists(getParams.project_id, conditionIdsToRetrieve, true, "Unable to retrieve Classifications");    
  })
  .then(function(retrievedConditionsResult){
    //handle cases where we have already finished retrieval of Classifications by this point
    if(retrievedConditionsResult.complete){
      return Q({
        complete: true
      });
    }    
    logger.debug("Retrieved Conditions to use in Classifications being retrieved.");
    for(var retrievedCondition of retrievedConditionsResult.results){
      try{
        var relatedPolicyId = extractPolicyIdFromConditionAfterRetrieve(retrievedCondition);
        logger.debug("Extracted Policy ID: "+relatedPolicyId+" from Condition with ID: "+retrievedCondition.id);
        var existingClassification = classificationsMap[relatedPolicyId];
        if(existingClassification===undefined){
          logger.debug("Failed to retrieve ID: "+relatedPolicyId + " from available Classifications map: "+strUtils.getString(classificationsMap));
          throw "Did not find Classification built from a Policy with ID: "+relatedPolicyId;
        }
        policyApiToClassification.buildClassificationFromCondition(retrievedCondition, existingClassification);
      }
      catch(errorThrown){
        logger.error("Error occurred while building Classifications from Conditions. Invalid Conditions may be in the system. Condition causing issue was: "+strUtils.getString(retrievedCondition)+ " Error was: "+strUtils.getString(errorThrown));
        throw apiErrorFactory.createError("Unable to retrieve Classifications");
      }
    }
    return Q();
  })
  .then(function(){
    //return Classifications
    deferredGet.resolve({
      classifications: classificationsToReturn,
      totalHits: classificationsTotalHits
    });
  })
  .fail(function(errorResponse){
    logger.error("Failed to retrieve Classifications: "+strUtils.getString(errorResponse));
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function update(updateParams){
  var deferredUpdate = Q.defer();
  var updatedClassification = {};
  var getClassificationResult;
  
  //validate that Classification exists while also retrieving the ID of the associated Condition
  getClassificationConditionAndPolicy(updateParams)
  .then(function(classificationResult){
    getClassificationResult = classificationResult;
    //check that any Term Lists used in the Conditions exist
    var termListIdsToCheck = classificationsHelper.getTermListIdsOnClassification(updateParams);
    if(termListIdsToCheck.length===0){
      //no Term Lists in use on Classification, no need to query for Lexicons
      logger.debug("No Term Lists used in Classification to be updated, no validation query required for Term Lists.");
      return Q();
    }
    logger.debug("Term Lists are used in Classification to be updated, checking that all specified Term Lists exist.");
    return lexiconsModel.getWithValidate(updateParams.project_id, termListIdsToCheck, null, defaultTermListsUsedNotFoundMessage);
  })
  .then(function(){    
    logger.debug("Any Term Lists passed to use in new Classification exist.");
  
    var policyForUpdate = getClassificationResult.policy;
    var conditionForUpdate = getClassificationResult.condition;
    logger.debug("Retrieved Classification information to use in updating. Policy ID: "+updateParams.id +" & Condition ID: "+conditionForUpdate.id);
    
    policyForUpdate.description = classificationsHelper.buildPolicyDescriptionFromObject(updateParams);
    conditionForUpdate.additional = updateParams.additional;
    classificationApiToPolicy.updateClassificationConditionAdditionalToPolicyForm(conditionForUpdate);
    logger.debug(function(){return "Caller 'additional' property updated to Policy API expected form: "+strUtils.getString(conditionForUpdate);});
    
    var updatePolicyPromise = policyModel.update(updateParams.project_id, policyForUpdate);
    var updateConditionPromise = conditionModel.update(updateParams.project_id, conditionForUpdate);
    
    //update classification object so it may be returned
    updatedClassification.additional = updateParams.additional;    

    updatedClassification.description = updateParams.description;
    updatedClassification.name = updateParams.name;
    updatedClassification.type = updateParams.type;
    
    return [updatePolicyPromise, updateConditionPromise];
  })
  .all()
  .spread(function(updatePolicyResult, updateConditionResult){
    logger.debug("Updated Policy and Condition associated with Classification ID: "+updateParams.id);
    deferredUpdate.resolve(updatedClassification);
  })
  .fail(function(errorResponse){
    logger.error("Failed to update Classification: "+strUtils.getString(errorResponse));
    
    //if the error was due to not finding Term Lists change the API Error type to invalid request. Logic of this decision is that item not found would be correct if the Term List was primary focus of request but here it is just a small part of the request and constitutes it being in an invalid state.
    if(errorResponse instanceof ApiError){
      if(errorResponse.message === defaultTermListsUsedNotFoundMessage){
        errorResponse.type = apiErrorTypes.INVALID_ARGUMENT;
      }
    }
    
    deferredUpdate.reject(errorResponse);
  }).done();
  
  return deferredUpdate.promise;
}