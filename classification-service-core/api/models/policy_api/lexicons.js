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
var pagingHelper = require('../../helpers/pagingHelper.js');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');
var apiErrorFactory = require('../errors/apiErrorFactory.js');

module.exports = {
  create: create,
  delete: deleteLexicon,
  get: get,
  getLexicons: getLexicons,
  getLexiconsByIds: getLexiconsByIds,
  getWithValidate: getWithValidate,
  update: update
};

var defaultNoMatchMessage = "Unable to find Lexicon with ID: ";
var defaultNotAllMatchedMessage = "Unable to find all Lexicons using IDs: ";

//returns a params object with common parameters for Lexicons. Takes in a project ID and uses that in the params.
function getDefaultParams(projectId){
  return {
    project_id: projectId,
    type: "lexicon"
  };
}

function create(projectId, lexicon){
  var createLexiconParams = getDefaultParams(projectId);  
  createLexiconParams.description = lexicon.description;
  createLexiconParams.name = lexicon.name;
  
  if(lexicon.additional!==undefined && lexicon.additional!==null){
    createLexiconParams.additional = lexicon.additional;
  }
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/create", createLexiconParams);
}

function deleteLexicon(projectId, id){
  var deleteLexiconParams = getDefaultParams(projectId);
  deleteLexiconParams.id = id;
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/delete", deleteLexiconParams);
}

//returns a promise to retrieve a Lexicon based on ID passed in. By default the lexicon expressions will not be returned and can be controlled by the 'getExpressions' parameter.
function get(projectId, id, getExpressions){
  var getLexiconParams = getDefaultParams(projectId);
  if(getExpressions){
    getLexiconParams.id = id;  
  }
  else{
    //when using filter Lexicon expressions are not returned
    getLexiconParams.additional = {
      filter: {
        "id": id
      }
    };
  }
  
  return policyHttpHelper.genericPolicyAPIGetItemRequest("classification/retrieve", getLexiconParams);
}

function getLexicons(projectId, pageNum, pageSize){
  var pageOptions = pagingHelper.getValidatedPagingParams(pageNum, pageSize);
  var getLexiconsParams = getDefaultParams(projectId);
  getLexiconsParams.max_page_results = pageOptions.pageSize;
  getLexiconsParams.start = pageOptions.start;
    
  return policyHttpHelper.genericPolicyAPIGetItemsRequest("classification/retrieve", getLexiconsParams);
}

function getLexiconsByIds(projectId, ids){
  var getLexiconsParams = getDefaultParams(projectId);
  getLexiconsParams.id = ids;  
  return policyHttpHelper.genericPolicyAPIGetItemsRequest("classification/retrieve", getLexiconsParams);
}

//Retuns a promise to check that given Lexicon(s) exist. lexiconIds may be either an array of IDs or single ID value. 'getExpressions' allows control over whether Lexicon Expressions are returned with the Lexicon (ignored for retrieving multiple IDs, will always returned lexicon expressions). Resolved result will be the retrieved Lexicon
function getWithValidate(projectId, lexiconId, getExpressions, noMatchMessage){
  var validatedPromise = Q.defer();
  var getPromise;
  if(Array.isArray(lexiconId)){
    getPromise = getLexiconsByIds(projectId, lexiconId);
  }
  else{
    getPromise = get(projectId, lexiconId, getExpressions);
  }
  
  getPromise.then(function(retrievedLexicon){
    //if request returned no results then reject
    if(retrievedLexicon===null || retrievedLexicon === undefined){
      if(noMatchMessage===undefined || noMatchMessage === null){
        if(!Array.isArray(lexiconId)){
          noMatchMessage = defaultNoMatchMessage +lexiconId;
        }
        else{
          noMatchMessage = defaultNotAllMatchedMessage +lexiconId;
        }
      }      
      validatedPromise.reject(apiErrorFactory.createNotFoundError(noMatchMessage));
      return;
    }
    
    validatedPromise.resolve(retrievedLexicon);
  })
  .fail(function(errorResponse){
    //throwing a more helpful error here if indication is that the Lexicon ID was wrong.
    if(errorResponse.response){
      if(!Array.isArray(lexiconId)){
        if(errorResponse.response.reason === "Could not find a match for the Lexicon requested."){
          if(noMatchMessage===undefined || noMatchMessage === null){
            noMatchMessage = defaultNoMatchMessage +lexiconId;
          }
        }
      }
      else {
        if(errorResponse.response.reason === "Could not find a match for all Lexicon items requested."){
          if(noMatchMessage===undefined || noMatchMessage === null){
            noMatchMessage = defaultNotAllMatchedMessage + lexiconId;
          }
        }
      }
      validatedPromise.reject(apiErrorFactory.createNotFoundError(noMatchMessage));
    }
    else{
      validatedPromise.reject(errorResponse);
    }
  }).done();
  return validatedPromise.promise;
}

function update(projectId, updatedLexicon, overwrite){
  var updateParams = getDefaultParams(projectId);
  updateParams.description = updatedLexicon.description;
  updateParams.id = updatedLexicon.id;
  updateParams.name = updatedLexicon.name;
    
  if(updatedLexicon.lexiconExpressions !== undefined){
    updateParams.additional = {
      lexicon_expressions: updatedLexicon.lexiconExpressions
    };
    //note, setting this property to 'ADD' when there are no Lexicon Expressions causes Policy API to throw an error.
    var updateBehaviour = "ADD";
    if(overwrite!==undefined && overwrite!== null){
      updateBehaviour = overwrite === true ? "REPLACE" : "ADD";
    }
    updateParams.update_behaviour = updateBehaviour;
  }

  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/update", updateParams);  
}