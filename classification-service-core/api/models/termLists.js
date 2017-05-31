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
//represents operations on classification service Term Lists
var Q = require('q');
var logger = require('../logging/logging.js');
var lexiconModel = require('./policy_api/lexicons.js');
var policyToProcessingHelper = require('../helpers/policyApiToClassificationApiHelper.js');

module.exports = {
  create: create,
  delete: deleteTermList,
  get: get,
  getTermLists: getTermLists,
  update: update
};

var defaultNoMatchMessage = "Unable to find Term List with ID: ";

function getNoTermListMatchMessage(id){
  return defaultNoMatchMessage + id;
}

function create(createTermListParams){
  var deferredCreate = Q.defer();
  
  var createLexiconParams = {
    description: createTermListParams.description,
    name: createTermListParams.name    
  };  
  lexiconModel.create(createTermListParams.project_id, createLexiconParams)
  .then(function(createdLexicon){
    var createdTermList = policyToProcessingHelper.buildTermListFromLexicon(createdLexicon);
    logger.debug(function(){return "Created Term List: "+JSON.stringify(createdTermList);});
    deferredCreate.resolve(createdTermList);
  })
  .fail(function(errorResponse){
    deferredCreate.reject(errorResponse);
  }).done();
  
  return deferredCreate.promise;
}

function deleteTermList(deleteTermListParams){
  var deferredDelete = Q.defer();
  
  //TODO verify behaviour when Term List is in use on a Classification
  
  //verify that specified Lexicon exists
  lexiconModel.getWithValidate(deleteTermListParams.project_id, deleteTermListParams.id, false, getNoTermListMatchMessage(deleteTermListParams.id))
  .then(function(retrievedLexicon){
    return lexiconModel.delete(deleteTermListParams.project_id, deleteTermListParams.id);
  })
  .then(function(){
    //lexicon expressions associated with a Lexicon are deleted automatically when deleting a Lexicon
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

function get(getTermListParams){
  var deferredGet = Q.defer();

  lexiconModel.getWithValidate(getTermListParams.project_id, getTermListParams.id, false, getNoTermListMatchMessage(getTermListParams.id))
  .then(function(retrievedLexicon){
    var retrievedTermList = policyToProcessingHelper.buildTermListFromLexicon(retrievedLexicon);
    logger.debug(function(){return "Retrieved Term List: "+JSON.stringify(retrievedTermList);});
    deferredGet.resolve(retrievedTermList);
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function getTermLists(getTermListsParams){
  var deferredGet = Q.defer();
  
  lexiconModel.getLexicons(getTermListsParams.project_id, getTermListsParams.pageNum, getTermListsParams.pageSize)
  .then(function(retrievedLexicons){
    var builtTermLists = [];
    for(var lexicon of retrievedLexicons.results){
      builtTermLists.push(policyToProcessingHelper.buildTermListFromLexicon(lexicon));
    }
    logger.debug(function(){return "Retrieved Term Lists: " + JSON.stringify(builtTermLists);});
    deferredGet.resolve({
      termLists: builtTermLists,
      totalHits: retrievedLexicons.totalhits
    });
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function update(updateTermListParams){
  var deferredUpdate = Q.defer();
  
  //validate that the specified Term List exists
  lexiconModel.getWithValidate(updateTermListParams.project_id, updateTermListParams.id, false, getNoTermListMatchMessage(updateTermListParams.id))
  .then(function(retrievedLexicon){
    var updateLexiconParams = {
      description: updateTermListParams.description,
      id: updateTermListParams.id,
      name: updateTermListParams.name
    };
    return lexiconModel.update(updateTermListParams.project_id, updateLexiconParams);
  })
  .then(function(updatedLexicon){
    var updatedTermList = policyToProcessingHelper.buildTermListFromLexicon(updatedLexicon);
    logger.debug(function(){return "Updated Term List: "+JSON.stringify(updatedTermList);});
    deferredUpdate.resolve(updatedTermList);
  })
  .fail(function(errorResponse){
    deferredUpdate.reject(errorResponse);
  }).done();
  
  return deferredUpdate.promise;
}