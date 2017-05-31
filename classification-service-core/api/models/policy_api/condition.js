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
var Q = require('q');
var httpHelper = require('../../helpers/httpPromiseHelper.js');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');
var logger = require('../../logging/logging.js');
var apiErrorFactory = require('../errors/apiErrorFactory.js');

module.exports = {
  create: create,
  delete: deleteCondition,
  deleteAll: deleteAll,
  get: get,
  getConditions: getConditions,
  getSingleConditionByNotes: getSingleConditionByNotes,
  update: update,
  validateConditionExists: validateConditionExists
};

//returns a params object with common parameters for Collection. Takes in a project ID and uses that in the params.
var getDefaultParams = function(projectId){
  return {
    project_id: projectId,
    type: "condition"
  };
};

function update(projectId, condition){
  var updateParams = getDefaultParams(projectId);
  updateParams.id = condition.id;
  updateParams.name = condition.name;
  updateParams.additional = condition.additional;
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/update", updateParams);
}

//create a condition using passed information. Returns a promise.
function create(projectId, condition){
  var createConditionParams = getDefaultParams(projectId);
  createConditionParams.name = condition.name;  
  if(condition.additional===null || condition.additional===undefined){
    logger.error("condition passed to 'create' on policy condition model had not 'additional' property set. Condition: "+JSON.stringify(condition));
    throw apiErrorFactory.createInvalidArgumentError("Invalid parameter passed for 'additional' property");
  }
  createConditionParams.additional = condition.additional;
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/create", createConditionParams);
}

//get a condition with the specified ID. Returns a promise.
function get(projectId, conditionId, includeChildren){
  var getConditionParams = getDefaultParams(projectId);
  getConditionParams.id = conditionId;
  getConditionParams.additional = {};
  if(includeChildren){
    getConditionParams.additional.include_children = true;
  }
  else {
    getConditionParams.additional.include_children = false;
  }
  return policyHttpHelper.genericPolicyAPIGetItemRequest("classification/retrieve", getConditionParams);
}

//gets conditions with specified IDs. Returns a promise
function getConditions(projectId, conditionIds, includeChildren){
  var getConditionsParams = getDefaultParams(projectId);
  getConditionsParams.id = conditionIds;
  getConditionsParams.additional = {};
  if(includeChildren){
    getConditionsParams.additional.include_children = true;
  }
  else {
    getConditionsParams.additional.include_children = false;
  }
  return policyHttpHelper.genericPolicyAPIGetItemsRequest("classification/retrieve", getConditionsParams);
}

//gets the first condition whose Notes field matches the value passed.
function getSingleConditionByNotes(projectId, notesValue){
  var getConditionParams = getDefaultParams(projectId);
  getConditionParams.additional = {
    filter: {
      notes: notesValue
    }
  };
  return policyHttpHelper.genericPolicyAPIGetItemRequest("classification/retrieve", getConditionParams);
}

//deletes a condition (and its children) with the specified ID. Returns a promise.
function deleteCondition(projectId, conditionId){
  var deleteConditionParams = getDefaultParams(projectId);
  deleteConditionParams.id = conditionId;
  
  var deletePromise = policyHttpHelper.genericPolicyAPIPostItemRequest("classification/delete", deleteConditionParams);
  var deferredDelete = Q.defer();
  deletePromise.then(function(resultOfDelete){
    httpHelper.handleDeleteResponseAndThrow(resultOfDelete);
    deferredDelete.resolve(resultOfDelete);
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  return deferredDelete.promise;
}

//deletes all conditions for the IDs passed. Returns a promise.
function deleteAll(projectId, conditionIds){
  var deleteConditionParams = getDefaultParams(projectId);
  deleteConditionParams.id = conditionIds;
  
  var deletePromise = policyHttpHelper.genericPolicyAPIPostItemRequest("classification/delete", deleteConditionParams);
  var deferredDelete = Q.defer();
  deletePromise.then(function(resultOfDelete){
    httpHelper.handleDeleteResponseAndThrow(resultOfDelete);
    deferredDelete.resolve(resultOfDelete);
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  return deferredDelete.promise;
}

//checks for the existence of specified Condition(s), returns a promise to retrieve Conditions(s). If ID(s) specified cause Policy API to find no match then the promise is rejected with the rejection message being controllable by method parameter 'notFoundMessage'.
//conditionId may be an array of integers or an integer
function validateConditionExists(projectId, conditionId, includeChildren, notFoundMessage){
  var validatedConditionPromise = Q.defer();
  var conditionRetrievePromise;
  
  if(Array.isArray(conditionId)){
    conditionRetrievePromise = getConditions(projectId, conditionId, includeChildren);
  }
  else {
    conditionRetrievePromise = get(projectId, conditionId, includeChildren);
  }
  
  conditionRetrievePromise.then(function(retrievedCondition){
    validatedConditionPromise.resolve(retrievedCondition);
  })
  .fail(function(errorResponse){
    //allowing throwing a more relevant message for caller here, if none specified we default to a more helpful message
    if(errorResponse.response && errorResponse.response.reason === "Could not return conditions for all ids"){ 
      validatedConditionPromise.reject(apiErrorFactory.createNotFoundError(notFoundMessage === undefined || notFoundMessage === null ? "Could not retrieve Conditions with IDs: "+conditionId : notFoundMessage));
    }
    else {
      validatedConditionPromise.reject(errorResponse);
    }
  }).done();
  
  return validatedConditionPromise.promise;
}