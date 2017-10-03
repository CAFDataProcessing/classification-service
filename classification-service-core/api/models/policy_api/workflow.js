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
var Q = require('q');
var logger = require('../../logging/logging.js');
var pagingHelper = require('../../helpers/pagingHelper.js');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');
var promiseHelper = require('../../helpers/httpPromiseHelper.js');
var apiErrorFactory = require('../errors/apiErrorFactory.js');

module.exports = {
  create: create,
  deleteWorkflowById: deleteWorkflowById,
  getWorkflowById: getWorkflowById,
  getWorkflows: getWorkflows,
  update: update,
  validateWorkflowExists: validateWorkflowExists
};

//returns a params object with common parameters for a Workflow. Takes in a project ID and uses that in the params.
var getDefaultWorkflowParams = function(projectId){
  return {
    project_id: projectId,
    type: "sequence_workflow"
  };
};

//Creates a Workflow using the specified definition object passed. Returns a promise that resolves with the created Workflow.
function create(project_id, newWorkflow){
  var createParams = getDefaultWorkflowParams(project_id);
  createParams.description = newWorkflow.description;
  createParams.notes = newWorkflow.notes;
  createParams.name = newWorkflow.name;
  
  return policyHttpHelper.genericPolicyAPIPostItemRequest("workflow/create", createParams);
}

//Deletes a Workflow with the specified ID. Returns a promise.
function deleteWorkflowById(project_id, workflowId){
  var deleteParams = getDefaultWorkflowParams(project_id);
  deleteParams.id = workflowId;
  
  return policyHttpHelper.genericPolicyAPIPostItemRequest("workflow/delete", deleteParams);
}

//Returns a promise to retrieve a Workflow by it's ID. Returns a promise.
function getWorkflowById(project_id, workflowId){
  var deferredGet = Q.defer();
  var getParams = getDefaultWorkflowParams(project_id);
  getParams.id = workflowId;
  
  //workflow retrieve returns an array of results when requesting by ID so we need to extract the first result
  var workflowExtract = function(workflowRetrieveResult){
    if(workflowRetrieveResult === null || workflowRetrieveResult === undefined || 
      workflowRetrieveResult.totalhits === 0 || 
      workflowRetrieveResult.results === null || workflowRetrieveResult.results === undefined ){
      //the API should complain and throw an error if Workflow not found but we will handle it just in case.
      logger.logError('No match returned for the Workflow requested. ID: '+getWorkflowParams.workflowId);
      throw new Error('No match returned for the Workflow requested. ID: '+getWorkflowParams.workflowId);
    }
    if(workflowRetrieveResult.totalhits > 1){
      logger.logWarn('More than one result returned when retrieving a Workflow by ID: '+ getWorkflowParams.workflowId);
    }
    return workflowRetrieveResult.results[0];
  };
  
  policyHttpHelper.policyAPIGetRequest("workflow/retrieve", getParams, 
    promiseHelper.handlePotentialSuccess(deferredGet, workflowExtract), promiseHelper.handleFailure(deferredGet));
  return deferredGet.promise;
}

function getWorkflows(project_id, pageNum, pageSize){
  var pageOptions = pagingHelper.getValidatedPagingParams(pageNum, pageSize);
  var getWorkflowsParams = getDefaultWorkflowParams(project_id);
  getWorkflowsParams.max_page_results = pageOptions.pageSize;
  getWorkflowsParams.start = pageOptions.start;
    
  return policyHttpHelper.genericPolicyAPIGetItemsRequest("workflow/retrieve", getWorkflowsParams);
}

//Updates a Workflow using the specified definition object passed. Returns a promise that resolves with the updated Workflow.
function update(project_id, updatedWorkflow){
  var updateParams = getDefaultWorkflowParams(project_id);
  updateParams.additional = updatedWorkflow.additional;
  updateParams.description = updatedWorkflow.description;
  updateParams.id = updatedWorkflow.id;
  updateParams.name = updatedWorkflow.name;
    
  return policyHttpHelper.genericPolicyAPIPostItemRequest("workflow/update", updateParams);
}

//Retuns a promise to check that a given Policy Workflow exists. Resolved result will be the retrieved Policy Workflow. Allows passing in a custom message to return when the specified Workflow is not found.
function validateWorkflowExists(projectId, workflowId, notFoundMessage){
  var validatedWorkflowPromise = Q.defer();
  getWorkflowById(projectId, workflowId)
  .then(function(retrievedWorkflow){
    validatedWorkflowPromise.resolve(retrievedWorkflow);
  })
  .fail(function(errorResponse){
    //throwing a more helpful error here if indication is that the Workflow ID was wrong.
    if(errorResponse.response && errorResponse.response.reason === "Could not find a match for the SequenceWorkflow requested."){    
      validatedWorkflowPromise.reject(apiErrorFactory.createNotFoundError(notFoundMessage === undefined || notFoundMessage === null ? "Unable to find Workflow with ID: "+workflowId : notFoundMessage));
    }
    else{
      validatedWorkflowPromise.reject(errorResponse);
    }
  }).done();
  return validatedWorkflowPromise.promise;
}