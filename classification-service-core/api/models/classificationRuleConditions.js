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
//represents operations that can be performed on Classification Service "Classification Rule Conditions"
var Q = require('q');
var logger = require('../logging/logging.js');
var apiErrorFactory = require('./errors/apiErrorFactory.js');
var ApiError = require('./errors/apiError.js');
var apiErrorTypes = require('./errors/apiErrorTypes.js');
var classificationObjectsHelper = require('../helpers/classificationObjectsHelper.js');
var classificationApiToPolicyHelper = require('../helpers/classificationApiToPolicyHelper.js');
var pagingHelper = require('../helpers/pagingHelper.js');
var policyApiObjectsHelper = require('../helpers/policyApiObjectsHelper.js');
var policyApiToClassificationHelper = require('../helpers/policyApiToClassificationApiHelper.js');
var ruleConditionsHelper = classificationObjectsHelper.conditions;
var rulesHelper = classificationObjectsHelper.rules;
var colSeqModel = require('./policy_api/collectionSequence.js');
var conditionModel = require('./policy_api/condition.js');
var lexiconsModel = require('./policy_api/lexicons.js');
var workflowModel = require('./policy_api/workflow.js');

module.exports = {
  create: create,
  delete: deleteClassificationRuleCondition,
  get: get,
  getClassificationRuleConditions: getClassificationRuleConditions,
  update: update,
  validateAndGetRuleRootCondition: validateAndGetRuleRootCondition
};

var defaultNoMatchMessage = "Could not retrieve Classification Rule with ID: ";
var defaultTermListsUsedNotFoundMessage = "Unable to find all Term List IDs specified in Rule Condition.";

//checks if the term lists passed in the condition parameter exist
function checkTermListsValid(projectId, condition){
  var deferredCheck = Q.defer();
  
  //check that any Term Lists used in the Conditions exist
  var termListIdsToCheck = ruleConditionsHelper.getTermListIdsOnCondition(condition);
  var checkTermListsValidPromise;
  if(termListIdsToCheck.length===0){
    //no Term Lists in use on Condition, no need to query for Lexicons
    logger.debug("No Term Lists used in Rule Conditions to be created, no validation query required for Term Lists.");
    checkTermListsValidPromise = Q();
  }
  else{
    logger.debug("Term Lists are used in Rule Conditions to be created, checking that all specified Term Lists exist.");
    checkTermListsValidPromise  = lexiconsModel.getWithValidate(projectId, termListIdsToCheck, null, defaultTermListsUsedNotFoundMessage);
  }
  checkTermListsValidPromise.then(function(){
    logger.debug("Any Term Lists passed to use in new Rule Conditions exist.");
    deferredCheck.resolve();
  })
  .fail(function(errorResponse){
    deferredCheck.reject(errorResponse);
  }).done();
  
  return deferredCheck.promise;
}

function create(createParams){
  var deferredCreate = Q.defer();
  var retrievedSeq;
  
  //check that the passed in Workflow and Classification Rule (while also retrieving all details) exist.  
  validateWorkflowAndSequence(createParams.project_id, createParams.workflowId, createParams.classificationRuleId, true)
  .then(function(validateResult){
    logger.debug("Verified Workflow and Classification Rule exist before creating Classification Rule Condition.");
    retrievedSeq = validateResult.collectionSequence;
    
    logger.debug("Checking that Term Lists used on Conditions are valid.");
    return checkTermListsValid(createParams.project_id, createParams);
  })
  .then(function(){
    //get the Rule Root condition if it is available on the retrieved Sequence (if a Collection refers to it)
    var ruleCondition = ruleConditionsHelper.getRuleConditionFromDetailedCollectionSequence(retrievedSeq);
    if(ruleCondition!==null){
      return Q(ruleCondition);
    }
    //if it wasn't returned on the sequence then query for it
    return getClassificationRuleRootCondition(createParams.project_id, createParams.classificationRuleId);
  })
  .then(function(ruleCondition){
    logger.debug(function(){return "Retrieved the Classification Rule Root Condition: "+JSON.stringify(ruleCondition);});
    
    //update supplied Condition with Policy API required properties (since we allow caller to specify simpler form)
    classificationApiToPolicyHelper.updateClassificationConditionAdditionalToPolicyForm(createParams);
    
    //create the condition the caller specified. It will use the Rule Root condition as it's parent.
    createParams.additional.parent_condition_id = ruleCondition.id;
    var createConditionParams = {
      additional: createParams.additional,
      name: createParams.name      
    };
    return conditionModel.create(createParams.project_id, createConditionParams);
  })
  .then(function(createdCondition){
    logger.debug(function(){return "Created condition under the Classification Rule with ID: " + createParams.classificationRuleId + ". Condition: " +JSON.stringify(createdCondition);});
    
    deferredCreate.resolve(policyApiToClassificationHelper.buildConditionFromPolicyCondition(createdCondition));
  })
  .fail(function(errorResponse){
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

function deleteClassificationRuleCondition(deleteParams){
  var deferredDelete = Q.defer();
  
  validateAndGetRuleRootCondition(deleteParams.project_id, deleteParams.workflowId, deleteParams.classificationRuleId)
  .then(function(validateResult){
    logger.debug(function(){return "Verified Workflow and Classification Rule exists and retrieved Classification Rule Root Condition with children when deleting specific Rule Condition. Root Condition ID: "+validateResult.rootCondition.id;});
    logger.debug(function(){return "Searching Classification Rule Root Condition children for requested Condition ID: "+deleteParams.id;});
    var matchedCondition = policyApiObjectsHelper.getConditionByIdFromClassificationRuleRootCondition(validateResult.rootCondition, deleteParams.id);
    if(matchedCondition===null){
      throw apiErrorFactory.createNotFoundError("Unable to find matching Condition with ID: "+deleteParams.id);
    }
    return conditionModel.delete(deleteParams.project_id,  deleteParams.id);
  })
  .then(function(){
    logger.debug("Successfully deleted Condition with ID: "+deleteParams.id+" from Classification Rule with ID: "+deleteParams.classificationRuleId);
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){    
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

function get(getParams){
  var deferredGet = Q.defer();
  
  validateAndGetRuleRootCondition(getParams.project_id, getParams.workflowId, getParams.classificationRuleId)
  .then(function(validateResult){
    var rootCondition = validateResult.rootCondition;
    logger.debug(function(){return "Verified Workflow and Classification Rule exists and retrieved Classification Rule Root Condition with children when retrieving specific Rule Condition. Root Condition ID: "+rootCondition.id;});
    logger.debug(function(){return "Searching Classification Rule Root Condition children for requested Condition ID: "+getParams.id;});
    var matchedCondition = policyApiObjectsHelper.getConditionByIdFromClassificationRuleRootCondition(rootCondition, getParams.id);
    if(matchedCondition===null){
      throw apiErrorFactory.createNotFoundError("Unable to find matching Condition with ID: "+getParams.id);
      return;
    }
    var conditionToReturn = policyApiToClassificationHelper.buildConditionFromPolicyCondition(matchedCondition);
    deferredGet.resolve(conditionToReturn);
  })
  .fail(function(errorResponse){    
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function getClassificationRuleConditions(getParams){
  var deferredGet = Q.defer();
  
  validateAndGetRuleRootCondition(getParams.project_id, getParams.workflowId, getParams.classificationRuleId)
  .then(function(validateResult){
    var ruleRootCondition = validateResult.rootCondition;
    logger.debug(function(){return "Verified Workflow and Classification Rule exist and retrieved Classification Rule Root Condition with children. Root Condition ID: "+ruleRootCondition.id;});

    var conditionsOnRule = policyApiToClassificationHelper.buildRuleConditionsFromRootRulePolicyCondition(ruleRootCondition);
    //paging support is implemented here since the call to retrieve children has no support for paging
    var pagingParams = pagingHelper.getValidatedPagingParams(getParams.pageNum, getParams.pageSize);    
    if(pagingParams.start > conditionsOnRule.length){
      //start index is greater than the number of entries, return empty array.
      deferredGet.resolve({        
        conditions: [],
        totalHits: conditionsOnRule.length
      });
      return Q({complete: true});
    }
    var conditionsToReturn = pagingHelper.buildArrayFromPagingParams(conditionsOnRule, pagingParams);
    deferredGet.resolve({
      conditions: conditionsToReturn,
      totalHits: conditionsOnRule.length
    });
  })
  .fail(function(errorResponse){    
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

//convenience method to find the Root Condition for a Classification Rule. Pass includeChildren as true to return child conditions. Returns a promise.
function getClassificationRuleRootCondition(projectId, ruleId){
  return conditionModel.getSingleConditionByNotes(projectId, rulesHelper.getClassificationRuleNotesValue(ruleId));
}

function update(updateParams){
  var deferredUpdate = Q.defer();
  var updatedCondition = updateParams.updatedRuleCondition;
  
  logger.debug("Checking that Term Lists used are valid.");
  checkTermListsValid(updateParams.project_id, updatedCondition)
  .then(function(){
    return validateAndGetRuleRootCondition(updateParams.project_id, updateParams.workflowId, updateParams.classificationRuleId);
  })  
  .then(function(validateResult){
    var rootCondition = validateResult.rootCondition;
    logger.debug(function(){return "Verified Workflow and Classification Rule exists and retrieved Classification Rule Root Condition with children when updating specific Rule Condition. Root Condition ID: "+rootCondition.id;});
    var matchedCondition = policyApiObjectsHelper.getConditionByIdFromClassificationRuleRootCondition(rootCondition, updateParams.id);
    if(matchedCondition===null){
      throw apiErrorFactory.createNotFoundError("Unable to find matching Condition with ID: "+updateParams.id);
    }
    //prepare condition provided to be sent to Policy API.
    updatedCondition.id = updateParams.id;
    //set the parent ID on the updated version of the condition (otherwise this will be updated to be 'isFragment=true' by Policy API)
    logger.debug(function(){return "Setting parent_condition_id of Condition to update to: "+matchedCondition.additional.parent_condition_id;});
    updatedCondition.additional.parent_condition_id = matchedCondition.additional.parent_condition_id;
    
    //update supplied Condition with Policy API required properties (since we allow caller to specify simpler form)
    logger.debug(function(){return "Updating Classification Rule Condition: "+JSON.stringify(updatedCondition);});
    classificationApiToPolicyHelper.updateClassificationConditionAdditionalToPolicyForm(updatedCondition);
    return conditionModel.update(updateParams.project_id, updatedCondition)
  })
  .then(function(updateResult){
    logger.debug(function(){return "Successfully updated Classification Rule Condition: "+updateParams.id;});
    deferredUpdate.resolve(updateResult);
  })
  .fail(function(errorResponse){    
    deferredUpdate.reject(errorResponse);
  }).done();
  
  return deferredUpdate.promise;
}

//validates a Workflow and Collection Sequence exist before finding the Classification Rule root condition (as returned by Policy API, with child details). Returns a promise with the workflow, collection sequence and root Classification Rule condition.
function validateAndGetRuleRootCondition(projectId, workflowId, ruleId){
  var deferredValidate = Q.defer();
  var workflow;
  var colSeq;
  
  validateWorkflowAndSequence(projectId, workflowId, ruleId, false)
  .then(function(validateWorkflowAndSequenceResult){
    logger.debug("Verified Workflow and Classification Rule exist before retrieving Classification Rule Root Condition.");
    colSeq = validateWorkflowAndSequenceResult.collectionSequence;
    workflow = validateWorkflowAndSequenceResult.workflow;
    return getClassificationRuleRootCondition(projectId, ruleId);
  })
  .then(function(ruleRootCondition){
    logger.debug(function(){return "Found ID of Classification Rule Root Condition, ID is: "+ruleRootCondition.id+" for Classification Rule: "+ruleId;});
    //Policy API filtering of conditions won't return the child conditions on the result so retrieve the condition by its ID stating to include children.
    return conditionModel.get(projectId, ruleRootCondition.id, true);
  })
  .then(function(rootConditionWithChildren){
    logger.debug("Retrieved Classification Rule Root condition (with children) for Rule ID: "+ruleId);
    deferredValidate.resolve({
      collectionSequence: colSeq,
      rootCondition: rootConditionWithChildren,
      workflow: workflow
    });
  })
  .fail(function(errorResponse){
    deferredValidate.reject(errorResponse);
  }).done();
  
  return deferredValidate.promise;
}

//expects an object with project_id, workflowId and classificationRuleId
function validateWorkflowAndSequence(project_id, workflowId, colSeqId, getAllDetailsForSeq){
  var deferredValidate = Q.defer();
  
  logger.debug("Checking that Workflow (ID: "+workflowId+") and Collection Sequence (ID: "+colSeqId+") exist");
  var validatedSeqPromise = colSeqModel.validateSequenceExists(project_id, 
    colSeqId, getAllDetailsForSeq, defaultNoMatchMessage + colSeqId);
  var validatedWorkflowPromise = workflowModel.validateWorkflowExists(project_id,
    workflowId);
  
  Q.allSettled([validatedWorkflowPromise, validatedSeqPromise]).spread(function(retrievedWorkflowResult, retrievedColSeqResult){
    if(retrievedWorkflowResult.state === "rejected"){
      throw retrievedWorkflowResult.reason;
    }
    if(retrievedColSeqResult.state === "rejected"){
      throw retrievedColSeqResult.reason;
    }
    //verify that Classification is an entry on the Workflow
    var rulesMap = rulesHelper.getRulePrioritiesFromPolicyWorkflow(retrievedWorkflowResult.value);
    rulePriority = rulesMap[colSeqId];
    if(rulePriority===undefined){      
      throw apiErrorFactory.createNotFoundError("Classification Rule ID: "+ colSeqId + " not found on Workflow with ID: "+workflowId);
    }    
    
    deferredValidate.resolve({
      collectionSequence: retrievedColSeqResult.value,
      workflow: retrievedWorkflowResult.value
    });
  })
  .fail(function(errorResponse){
    deferredValidate.reject(errorResponse);
  }).done();
  
  return deferredValidate.promise;
}