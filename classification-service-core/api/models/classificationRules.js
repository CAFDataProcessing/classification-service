/*
 * Copyright 2015-2017 EntIT Software LLC, a Micro Focus company.
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
//represents operations that can be performed on Classification Service "Classification Rules"
var Q = require('q');
var logger = require('../logging/logging.js');
var strUtils = require('../libs/stringUtils.js');
var ruleObjectsHelper = require('../helpers/classificationObjectsHelper.js').rules;
var policyObjectsHelper = require('../helpers/policyApiObjectsHelper.js');
var pagingHelper = require('../helpers/pagingHelper.js');
var policyApiToClassification = require('../helpers/policyApiToClassificationApiHelper.js');
var colSeqModel = require('./policy_api/collectionSequence.js');
var workflowModel = require('./policy_api/workflow.js');
var workflowEntryModel = require('./policy_api/workflow_entry.js');
var conditionModel = require('./policy_api/condition.js');
var apiErrorFactory = require('./errors/apiErrorFactory.js');
var ruleClassificationsModel = require('./ruleClassifications.js');
var validation = require('./validation.js');

module.exports = {
  create: create,
  delete: deleteClassificationRule,
  get: get,
  getClassificationRules: getClassificationRules,
  update: update
};

var defaultNoMatchMessage = "Could not retrieve Classification Rule with ID: ";

function create(createParams){
  var deferredCreate = Q.defer();
  //hold the created rule to build up and return in response
  var createdRule = {};  
  var workflowToUpdate;
  //retrieve the workflow to get its details so an update can be performed
  workflowModel.validateWorkflowExists(createParams.project_id, createParams.workflowId)
  .then(function(retrievedWorkflow){
    logger.debug(function(){return "Retrieved Workflow with ID: "+createParams.workflowId+" to create Classification Rule.";});
    workflowToUpdate = retrievedWorkflow;
    
    var collectionSequenceToCreate = {
      name: createParams.name,
      description: createParams.description
    };
    return colSeqModel.create(createParams.project_id, collectionSequenceToCreate);
  })
  .then(function(createdColSeq){
    logger.debug("As part of Creating Classification Rule, created Collection Sequence with ID: "+createdColSeq.id);    
    //add the newly created collection sequence as an entry in the workflow
    var newEntry = policyObjectsHelper.insertCollectionSequenceIntoWorkflowEntries(workflowToUpdate, createdColSeq.id, createParams.priority);  
    createdRule = policyApiToClassification.buildClassificationRuleFromCollectionSequenceAndOrder(createdColSeq, newEntry.order);
    logger.debug("Updating Workflow ID: "+ workflowToUpdate.id+" with entry for Collection Sequence ID: "+createdColSeq.id + " as part of creating Classification Rule");
    return workflowModel.update(createParams.project_id, workflowToUpdate);
  })
  .then(function(){
    logger.debug("Updated Workflow with entry for created Collection Sequence: "+createdRule.id);
    //create a condition associated with this Rule that can be used to add Rule level conditions.    
    var ruleCondition = ruleObjectsHelper.getNewRuleRootLevelCondition(createdRule.id);
    logger.debug("Creating Condition for use with Rule ID: "+createdRule.id);
    return conditionModel.create(createParams.project_id, ruleCondition);
  })
  .then(function(){
    //rule was created and added to the workflow, output the representation of the Rule
    deferredCreate.resolve(createdRule);
  })
  .fail(function(errorResponse){
    deferredCreate.reject(errorResponse);
  }).done();
  
  return deferredCreate.promise;
}

function deleteClassificationRule(deleteParams){
  var deferredDelete = Q.defer();
  
  //check that the passed in Workflow and Classification Rule (while also retrieving all details) exist.  
  var validatedSeqPromise = colSeqModel.validateSequenceExists(deleteParams.project_id, 
    deleteParams.id, true, defaultNoMatchMessage + deleteParams.id);
  var validatedWorkflowPromise = workflowModel.validateWorkflowExists(deleteParams.project_id,
    deleteParams.workflowId);
  var workflow;
    
  Q.allSettled([validatedWorkflowPromise, validatedSeqPromise]).spread(function(retrievedWorkflowResult, retrievedColSeqResult){
    if(retrievedWorkflowResult.state === "rejected"){
      throw retrievedWorkflowResult.reason;
    }
    if(retrievedColSeqResult.state === "rejected"){
      throw retrievedColSeqResult.reason;
    }
    logger.debug("Verified Workflow and Classification Rule exist before deleting.");
    workflow = retrievedWorkflowResult.value;
    
    //get priority from the Workflow result (sequence_entries should be on the Workflow)
    var rulesMap = ruleObjectsHelper.getRulePrioritiesFromPolicyWorkflow(workflow);
    rulePriority = rulesMap[deleteParams.id];
    if(rulePriority===undefined){      
      throw apiErrorFactory.createNotFoundError("Classification Rule ID: "+ deleteParams.id + " not found on Workflow with ID: "+deleteParams.workflowId);
    }    
    
    logger.debug("Deleting any Rule Classifications under the Classification Rule: "+deleteParams.id);
    var deleteRuleClassificationsParams = {
      classificationRuleId: deleteParams.id,
      project_id: deleteParams.project_id,
      workflowId: deleteParams.workflowId
    };
    return ruleClassificationsModel.deleteAll(deleteRuleClassificationsParams);
  })
  .then(function(){
    logger.debug("Removing Collection Sequence with ID: "+ deleteParams.id+" from Workflow with ID: "+deleteParams.workflowId);
    policyObjectsHelper.removeCollectionSequenceFromWorkflowEntries(workflow, deleteParams.id);
    return workflowModel.update(deleteParams.project_id, workflow); 
  })
  .then(function(){
    logger.debug("Removed Collection Sequence with ID: "+ deleteParams.id+" from Workflow with ID: "+deleteParams.workflowId);
    //delete the root Classification Rule Condition for the Rule, first we need to retrieve the condition with matching notes field
    return conditionModel.getSingleConditionByNotes(deleteParams.project_id, ruleObjectsHelper.getClassificationRuleNotesValue(deleteParams.id));
  })
  .then(function(retrievedCondition){
    logger.debug("Retrieved Classification Rule Root Condition as part of Classification Rule delete, Rule Root Condition ID: "+retrievedCondition.id);
    //delete this condition (by this point any fragments using it should have been deleted)
    return conditionModel.delete(deleteParams.project_id, retrievedCondition.id);
  })
  .then(function(){
    logger.debug("Deleted Classification Rule Root Condition");
    //delete collection sequence representing the rule
    return colSeqModel.delete(deleteParams.project_id, deleteParams.id);
  })
  .then(function(){
    logger.debug("Completed deletion of Classification Rule with ID: "+deleteParams.id);
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

function get(getParams){
  var deferredGet = Q.defer();  
  var retrievedClassificationRule;
  var rulePriority;
  
  validation.validateWorkflowAndSeqForRule(getParams)
  .then(function(validateResult){
    deferredGet.resolve(validateResult.classificationRule);
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function getClassificationRules(getParams){
  var deferredGet = Q.defer();
  var totalHits = 0;
  var builtClassificationsMap = {};
  var builtClassifications = [];
  
  workflowModel.validateWorkflowExists(getParams.project_id, getParams.workflowId)
  .then(function(retrievedWorkflow){
    logger.debug("Verified that Workflow requested while retrieving Classification Rules exists for Workflow ID: "+getParams.workflowId);
    //the retrieved workflow will have all the entries on it so handle paging here rather than calling Policy API again
    if(retrievedWorkflow.additional===undefined || retrievedWorkflow.additional===null ||
    retrievedWorkflow.additional.sequence_entries===undefined || retrievedWorkflow.additional.sequence_entries===null){
      logger.error("Workflow retrieved with ID: "+getParams.workflowId+" has no 'additional.sequence_entries' property set");
      throw apiErrorFactory.createError("Unable to read Classification Rule entries on Workflow retrieved with ID: "+getParams.workflowId);
    }
    totalHits = retrievedWorkflow.additional.sequence_entries.length;
    var pagingParams = pagingHelper.getValidatedPagingParams(getParams.pageNum, getParams.pageSize);
    if(pagingParams.pageSize === 0 || retrievedWorkflow.additional.sequence_entries.length === 0){
      //if request was for page size 0 then return no results.
      logger.debug("PageSize for retrieving Classification Rules is 0 or there are no entries on the Workflow, will not get Collection Sequences.");
      deferredGet.resolve({        
        classificationRules: [],
        totalHits: totalHits
      });
      return Q({complete: true});
    }
    var colSeqIds = pagingHelper.buildArrayFromPagingParams(retrievedWorkflow.additional.sequence_entries, pagingParams, function(item){
      //build classification here so that order of page results is preserved
      var builtClassification = policyApiToClassification.buildClassificationRuleFromWorkflowEntry(item);
      builtClassifications.push(builtClassification);
      builtClassificationsMap[item.collection_sequence_id] = builtClassification;
      return item.collection_sequence_id;
    });
    if(colSeqIds.length === 0){
      logger.debug("No collection sequence IDs extracted from workflow sequence_entries based on provided entries and paging parameters.");
      deferredGet.resolve({        
        classificationRules: [],
        totalHits: totalHits
      });
      return Q({complete: true});
    }
    
    logger.debug(function(){return "Built list of Collection Sequences to get as part of retrieving Classification Rules. Sequence IDs"+colSeqIds;});
    return colSeqModel.getCollectionSequencesByIds(getParams.project_id, colSeqIds, 1, colSeqIds.length);
  })
  .then(function(retrievedSeqs){
    if(retrievedSeqs.complete){
      return Q({complete: true});
    }    
    logger.debug("Retrieved Collection Sequences to use in retrieving Classification Rules.");   
    
    for(var retrievedSeq of retrievedSeqs.results){
      policyApiToClassification.buildClassificationRuleFromCollectionSequence(retrievedSeq, builtClassificationsMap[retrievedSeq.id]);
    }
    deferredGet.resolve({        
        classificationRules: builtClassifications,
        totalHits: totalHits
      });
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function update(updateParams){
  var deferredUpdate = Q.defer();
  var updatedRule;
  var associatedWorkflow;
  
  //validate Workflow and Rule exist
  validation.validateWorkflowAndSeqForRule(updateParams)
  .then(function(validateResult){
    associatedWorkflow = validateResult.workflow;
    
    var updateColSeqParams = {
      id: updateParams.id,
      name: updateParams.name,
      description: updateParams.description
    };
    return colSeqModel.update(updateParams.project_id, updateColSeqParams, colSeqModel.defaults.updateBehaviour.add);
  })
  .then(function(updatedColSeq){
    logger.debug("Updated Collection Sequence with ID: "+updateParams.id);
    updatedRule = policyApiToClassification.buildClassificationRuleFromCollectionSequence(updatedColSeq);
    
    policyObjectsHelper.updateOrderOnWorkflowEntries(associatedWorkflow, updateParams.id, updateParams.priority);
    
    var updatePolWorkflowParams = {
      description: associatedWorkflow.description,
      id: associatedWorkflow.id,
      name: associatedWorkflow.name,
      additional: {
        notes: associatedWorkflow.notes,
        sequence_entries: associatedWorkflow.additional.sequence_entries
      }
    };    
    return workflowModel.update(updateParams.project_id, updatePolWorkflowParams);
  })
  .then(function(){
    logger.debug("Updated Workflow with ID: "+associatedWorkflow.id +" as part of updated Classification Rule.");
    updatedRule.priority = updateParams.priority;
    deferredUpdate.resolve(updatedRule);
  })
  .fail(function(errorResponse){
    deferredUpdate.reject(errorResponse);
  }).done();
  
  return deferredUpdate.promise;
}