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
var NodeCache = require( "node-cache" );
var appConfig = require('../../config/classificationServiceConfig.js');
var httpHelper = require('../../helpers/httpPromiseHelper.js');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');
var errorResponseHelper = require('../errors/errorResponse.js');
var apiErrorFactory = require('../errors/apiErrorFactory.js');
var pagingHelper = require('../../helpers/pagingHelper.js');

module.exports = {
  create: create,
  delete: deletePolicy,
  deleteAll: deleteAll,
  get: get,
  getPolicies: getPolicies,
  getPoliciesByIds: getPoliciesByIds,
  update: update,
  validatePolicyExists: validatePolicyExists
};

//returns a params object with common parameters for Policy. Takes in a project ID and uses that in the params.
var getDefaultParams = function(projectId){
  return {
    project_id: projectId,
    type: "policy"
  };
};

//setting up caches
var policyCache = new NodeCache({
  stdTTL: appConfig.cacheDuration
});
var buildCacheKey = function(projectId, typeId){
  return projectId + typeId;
};

//get a policy with the specified ID. Returns a promise.
function get(projectId, policyId){
  //if this Policy is already in the cache then return it (wrapped in a promise)
  var cachedPolicy = policyCache.get(buildCacheKey(projectId, policyId));
  if(cachedPolicy!==undefined){
    return Q(cachedPolicy);
  }
  var getPolicyParams = getDefaultParams(projectId);
  getPolicyParams.id = policyId;
  
  var getPolicyPromise = policyHttpHelper.genericPolicyAPIGetItemRequest("policy/retrieve", getPolicyParams);
  getPolicyPromise.then(function(result){
    policyCache.set(buildCacheKey(projectId, policyId), result);
  });
  return getPolicyPromise;
}

//get policies using specified paging parameters. Returns a promise
function getPolicies(projectId, pageNum, pageSize){
  var pageOptions = pagingHelper.getValidatedPagingParams(pageNum, pageSize);
  var getParams = getDefaultParams(projectId);
  
  getParams.max_page_results = pageOptions.pageSize;
  getParams.start = pageOptions.start;
    
  return policyHttpHelper.genericPolicyAPIGetItemsRequest("policy/retrieve", getParams);
}

//gets Policies with IDs matching those in the 'ids' property on the params object passed. Returns a promise.
function getPoliciesByIds(projectId, params){
  var getPoliciesParams = getDefaultParams(projectId);
  
  var idsToRequest = [];
  var policiesFromCache = [];
  //see if we have any of these Policies already in the cache to avoid requesting them again
  for(var policyId of params.ids){
    var policyFromCache = policyCache.get(buildCacheKey(projectId, policyId));
    if(policyFromCache===undefined){
      idsToRequest.push(policyId);
    }
    else {
      policiesFromCache.push(policyFromCache);
    }
  }
  
  //if we have all the ids in the cache then construct a response without going to the API
  if(idsToRequest.length ===0){
    return Q({
      totalhits: policiesFromCache.length,
      results: policiesFromCache
    });
  }
  
  getPoliciesParams.id = idsToRequest;
  
  var deferredGetPolicies = Q.defer();
  policyHttpHelper.genericPolicyAPIGetItemsRequest("policy/retrieve", getPoliciesParams)
  .then(function(returnedPolicies){
    //add these retrieved entries to the cache
    for(var returnedPolicy of returnedPolicies.results){
      policyCache.set(buildCacheKey(projectId, returnedPolicy.id), returnedPolicy);
    }
    //add those that were already in the cache to the results
    returnedPolicies.totalhits += policiesFromCache.length;
    returnedPolicies.results = returnedPolicies.results.concat(policiesFromCache);    
    
    deferredGetPolicies.resolve(returnedPolicies);
  })
  .fail(function(errorResponse){
    deferredGetPolicies.reject(errorResponse);
  }).done();
  return deferredGetPolicies.promise;
}

//create a policy with the specified object passed. Returns a promise.
function create(projectId, policy){
  var createPolicyParams = getDefaultParams(projectId);
  createPolicyParams.description = policy.description;
  createPolicyParams.name = policy.name;
  //allow passing either 'additional' or individual properties
  if(policy.additional===undefined || policy.additional===null){
    createPolicyParams.additional ={
      details: policy.details,
      policy_type_id: policy.typeId,
      priority: policy.priority
    };
  }
  else{
    createPolicyParams.additional = policy.additional;
  }
  var createPromise = policyHttpHelper.genericPolicyAPIPostItemRequest("policy/create", createPolicyParams);
  createPromise.then(function(result){
    policyCache.set(buildCacheKey(projectId, result.id), result);
  });
  return createPromise;
}

//update a policy with the specified object passed
function update(projectId, policy){
  var updatePolicyParams = getDefaultParams(projectId);
  updatePolicyParams.description = policy.description;
  updatePolicyParams.id = policy.id;
  updatePolicyParams.name = policy.name;
  if(policy.additional===undefined || policy.additional===null){
    updatePolicyParams.additional ={
      details: policy.details,
      policy_type_id: policy.typeId,
      priority: policy.priority
    };
  }
  else{
    updatePolicyParams.additional = policy.additional;
  }
  var updatePromise = policyHttpHelper.genericPolicyAPIPostItemRequest("policy/update", updatePolicyParams);
  //update the entry on the cache
  updatePromise.then(function(result){
    policyCache.set(buildCacheKey(projectId, policy.id), result);
  });
  
  return updatePromise;
}
//delete a policy with specified ID. Returns a promise.
function deletePolicy(projectId, policyId){
  var deletePolicyParams = getDefaultParams(projectId);
  deletePolicyParams.id = policyId;

  var deferredDelete = Q.defer();
  var deletePromise = policyHttpHelper.genericPolicyAPIPostItemRequest("policy/delete", deletePolicyParams);
  deletePromise.then(function(result){
    policyCache.del(buildCacheKey(projectId, policyId));
  });
  deletePromise.then(function(result){
    //if Policy API can't delete it returns 200 status and a body conveying error.
    httpHelper.handleDeleteResponseAndThrow(result);
    deferredDelete.resolve(result)
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}
//delete all Policies passed in. Returns a promise.
function deleteAll(projectId, policyIds){
  var deletePolicyParams = getDefaultParams(projectId);
  deletePolicyParams.id = policyIds;

  var deletePromise = policyHttpHelper.genericPolicyAPIPostItemRequest("policy/delete", deletePolicyParams);
  deletePromise.then(function(result){
    for(var policyId of policyIds){
      policyCache.del(buildCacheKey(projectId, policyId));
    }
  })
  .fail(function(errorResponse){
    errorResponseHelper.writeErrorToLog(errorResponse);
  })
  .done();
  return deletePromise;
}

function validatePolicyExists(projectId, policyId, notFoundMessage){
  var validatedPolicyPromise = Q.defer();
  get(projectId, policyId)
  .then(function(retrievedPolicy){
    validatedPolicyPromise.resolve(retrievedPolicy);
  })
  .fail(function(errorResponse){
    //allowing throwing a more relevant message for caller here
    if(errorResponse.response && errorResponse.response.message === "Could not retrieve Policy"){ 
      validatedPolicyPromise.reject(apiErrorFactory.createNotFoundError(notFoundMessage === undefined || notFoundMessage === null ? "Could not retrieve Policy with ID: "+policyId : notFoundMessage, errorResponse.response.correlation_code));
    }
    else {
      validatedPolicyPromise.reject(errorResponse);
    }
  }).done();
  
  return validatedPolicyPromise.promise;
}