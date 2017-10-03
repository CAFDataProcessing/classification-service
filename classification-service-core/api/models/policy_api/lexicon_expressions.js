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
var apiErrorFactory = require('../errors/apiErrorFactory.js');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');

module.exports = {
  delete: deleteExpression,
  deleteAll: deleteAll,
  get: get,
  getWithValidate: getWithValidate,
  update: update
};

//returns a params object with common parameters for Lexicon Expressions. Takes in a project ID and uses that in the params.
function getDefaultParams(projectId){
  return {
    project_id: projectId,
    type: "lexicon_expression"
  };
}

function deleteExpression(projectId, id){
  var deleteParams = getDefaultParams(projectId);
  deleteParams.id = id;
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/delete", deleteParams);
}

//takes an array of Lexicon Expression IDs and deletes them all
function deleteAll(projectId, ids){
  //conversion of array object is handled in another layer so we can call through to deleteExpression here as logic is the same. Separate method for clarity of available options.
  return deleteExpression(projectId, ids);
}

function get(projectId, id){
  var getParams = getDefaultParams(projectId);
  getParams.id = id;
  return policyHttpHelper.genericPolicyAPIGetItemRequest("classification/retrieve", getParams);
}

var defaultNoMatchMessage = "Unable to find Lexicon Expression with ID: ";
//Retuns a promise to check that a given Lexicon Expression exists. Resolved result will be the retrieved Lexicon Expression
function getWithValidate(projectId, id, noMatchMessage){
  var validatedPromise = Q.defer();
  get(projectId, id)
  .then(function(retrievedLexiconExpression){
    validatedPromise.resolve(retrievedLexiconExpression);
  })
  .fail(function(errorResponse){
    //throwing a more helpful error here if indication is that the Lexicon ID was wrong.
    if(errorResponse.response && errorResponse.response.reason === "Could not find a match for the LexiconExpression requested."){
      if(noMatchMessage===undefined || noMatchMessage === null){
        noMatchMessage = defaultNoMatchMessage +id;
      }      
      validatedPromise.reject(apiErrorFactory.createNotFoundError(noMatchMessage));
    }
    else{
      validatedPromise.reject(errorResponse);
    }
  }).done();
  return validatedPromise.promise;
}

function update(projectId, updateExpressionParams){
  var updateParams = getDefaultParams(projectId);
  updateParams.id = updateExpressionParams.id;
  updateParams.additional = {
    "expression": updateExpressionParams.expression,
    "lexicon_id": updateExpressionParams.lexiconId,
    "type": updateExpressionParams.type
  };
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/update", updateParams);  
}