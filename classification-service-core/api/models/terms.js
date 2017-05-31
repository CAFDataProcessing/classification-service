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
//represents operations on classification service Terms
var Q = require('q');
var lexiconModel = require('./policy_api/lexicons.js');
var lexiconExpressionsModel = require('./policy_api/lexicon_expressions.js');
var policyToProcessingHelper = require('../helpers/policyApiToClassificationApiHelper.js');
var classificationApiToPolicyHelper = require('../helpers/classificationApiToPolicyHelper.js');
var pagingHelper = require('../helpers/pagingHelper.js');
var policyObjectsHelper = require('../helpers/policyApiObjectsHelper.js');
var apiErrorFactory = require('./errors/apiErrorFactory.js');
var apiError = require('./errors/apiError.js');
var logger = require('../logging/logging.js');

module.exports = {
  delete: deleteTerm,
  deleteTerms: deleteTerms,
  get: get,
  getTerms: getTerms,
  update: update,
  updateTerms: updateTerms
};
var defaultNoTermListMatchMessage = "Unable to find Term List with ID: ";
var defaultNoMatchMessage = "Unable to find Term with ID: ";

function getNoTermListMatchMessage(id){
  return defaultNoTermListMatchMessage + id;
}

function deleteTerm(deleteTermParams){
  var deferredDelete = Q.defer();
  
  //verify that term list exists and term is on it
  get(deleteTermParams)
  .then(function(term){
    return lexiconExpressionsModel.delete(deleteTermParams.project_id, deleteTermParams.id);
  })
  .then(function(){
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

//removes all terms from specified term list, requires an existing Term List to be passed to it
function deleteAllTerms(deleteTermsParams, existingLexicon){
  var deferredDelete = Q.defer();
  
  //update the term list to have only a single Lexicon on it (Policy API doesn't allow empty array here)
  //then delete that single term
  var updateLexiconParams = {
    description: existingLexicon.description,
    id: existingLexicon.id,
    //pass a single Lexicon Expression and use the overwrite behaviour to remove existing Expressions.
    lexiconExpressions: [{
      "type":"lexicon_expression",
      "additional": {
        "type": "text",
        "expression": "$DELETE_PLACEHOLDER$"
      }
    }],
    name: existingLexicon.name
  };
  logger.debug("Updating Lexicon to only have a single placeholder Lexicon Expression. This will delete all the current Lexicon Expressions on the Lexicon.");
  lexiconModel.update(deleteTermsParams.project_id, updateLexiconParams, true)
  .then(function(updatedLexicon){
    logger.debug("Update for Lexicon ID "+ existingLexicon.id +" performed. Only placeholder Lexicon Expression should be present on the Lexicon.");
    //get the ID of the newly created Lexicon so it can be deleted
    var newExpressionId = updatedLexicon.additional.lexicon_expressions[0].id;
    return lexiconExpressionsModel.delete(deleteTermsParams.project_id, newExpressionId);
  })
  .then(function(){
    logger.debug("Deleted placeholder Lexicon Expression from Lexicon with ID: "+existingLexicon.id);
    deferredDelete.resolve({});
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

function deleteTerms(deleteTermsParams){
  var deferredDelete = Q.defer();
  
  //verify that term list exists, retrieve terms so that we can verify all provided IDs are on this term list
  lexiconModel.getWithValidate(deleteTermsParams.project_id, deleteTermsParams.termListId, true, getNoTermListMatchMessage(deleteTermsParams.termListId))
  .then(function(retrievedLexicon){
    logger.debug("Validated that Lexicon exists with ID: "+deleteTermsParams.termListId);
    //if there are no Expressions on the Lexicon then no delete operation required.
    if(retrievedLexicon.additional.lexicon_expressions === null || retrievedLexicon.additional.lexicon_expressions.length === 0){
      logger.debug("There are no Lexicon Expressions on the Lexicon.");
      if(deleteTermsParams.terms.length > 0){
        throw apiErrorFactory.createNotFoundError("IDs specified not found on Term List. IDs: "+ JSON.stringify(deleteTermsParams.terms));
      }
      return Q();
    }

    //if caller passed no terms then need to remove ALL Lexicon Expressions
    if(deleteTermsParams.terms.length===0){
      logger.debug("No Terms passed in call. Deleting all Terms from Term List.");
      return deleteAllTerms(deleteTermsParams, retrievedLexicon);
    }
  
    //check passed IDs are in the returned lexicon expressions
    logger.debug("Validating that specified IDs are on the Lexicon Expression.");
    var notFoundIDs = policyObjectsHelper.checkLexiconExpressionsIdsOnLexicon(retrievedLexicon, deleteTermsParams.terms);
    
    if(notFoundIDs.length > 0){
      throw apiErrorFactory.createNotFoundError("IDs specified not found on Term List. IDs: "+ JSON.stringify(notFoundIDs));
    }
    logger.debug("All IDs are on the Lexicon, attempting delete of Lexicon Expressions.");
    lexiconExpressionsModel.deleteAll(deleteTermsParams.project_id, deleteTermsParams.terms);
  })
  .then(function(){
    deferredDelete.resolve();
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
  
  return deferredDelete.promise;
}

function get(getTermParams){
  var deferredGet = Q.defer();
  
  //verify that the term list exists
  lexiconModel.getWithValidate(getTermParams.project_id, getTermParams.termListId, false, getNoTermListMatchMessage(getTermParams.termListId))
  .then(function(retrievedLexicon){
    logger.debug("Validated that Lexicon exists with ID: "+getTermParams.termListId);
    //retrieve the Lexicon Expression matching the Term ID    
    return lexiconExpressionsModel.getWithValidate(getTermParams.project_id, getTermParams.id, defaultNoMatchMessage + getTermParams.id);
  })
  .then(function(retrievedLexiconExpression){
    logger.debug(function(){return "Retrieved Lexicon Expression: " + JSON.stringify(retrievedLexiconExpression);});
    //check that lexicon ID on the Lexicon Expression matches specified Term List ID
    var lexiconId = retrievedLexiconExpression.additional.lexicon_id;
    if(lexiconId!==getTermParams.termListId){
      throw apiErrorFactory.createNotFoundError("Unable to find Term with ID: "+ getTermParams.id + " on Term List: "+getTermParams.termListId);
    }
    
    var term = policyToProcessingHelper.buildTermFromLexiconExpression(retrievedLexiconExpression);
    deferredGet.resolve(term);
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function getTerms(getTermsParams){
  var deferredGet = Q.defer();
  
  //verify that the term list exists and retrieve the terms on it
  lexiconModel.getWithValidate(getTermsParams.project_id, getTermsParams.termListId, true, getNoTermListMatchMessage(getTermsParams.termListId))
  .then(function(retrievedLexicon){
    //only retrieve as many Terms as requested by paging parameters
    var pagingParams = pagingHelper.getValidatedPagingParams(getTermsParams.pageNum, getTermsParams.pageSize);    
    if(retrievedLexicon.additional.lexicon_expressions===null){
      deferredGet.resolve({
        terms: [],
        totalHits: 0
      });
    }
    var termsToReturn = [];
    var expressionCounter = 0;
    for(var expression of retrievedLexicon.additional.lexicon_expressions){
      expressionCounter++;      
      //check if we have reached max pageSize, if so then we just need to get the total number of expressions
      if(termsToReturn.length >= pagingParams.pageSize){
        continue;
      }      
      //only return those entries from paging start index onwards
      if(expressionCounter < pagingParams.start){
        continue;
      }
      termsToReturn.push(policyToProcessingHelper.buildTermFromLexiconExpression(expression));
    }
    deferredGet.resolve({
      terms: termsToReturn,
      totalHits: expressionCounter
    });
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}

function update(updateTermParams){
  var deferredUpdate = Q.defer();
  
  //verify the term list specified exists and that term is on it
  get(updateTermParams)
  .then(function(retrievedLexiconExpression){
    var updateExpressionParams = {
      expression: updateTermParams.expression,
      id: updateTermParams.id,
      lexiconId: updateTermParams.termListId,
      type: updateTermParams.type
    };
    return lexiconExpressionsModel.update(updateTermParams.project_id, updateExpressionParams);
  })
  .then(function(updateResult){
    deferredUpdate.resolve({});
  })
  .fail(function(errorResponse){
    deferredUpdate.reject(errorResponse);
  }).done();  
  
  return deferredUpdate.promise;
}

function updateTerms(updateTermsParams){
  var deferredUpdate = Q.defer();
  
  //verify the term list specified exists
  lexiconModel.getWithValidate(updateTermsParams.project_id, updateTermsParams.termListId, false, getNoTermListMatchMessage(updateTermsParams.termListId))
  .then(function(retrievedLexicon){
    var lexiconExpressions = classificationApiToPolicyHelper.buildLexiconExpressionsFromTerms(updateTermsParams.terms, updateTermsParams.termListId);
    
    //update the lexicon with the new terms, specifying whether to overwrite existing Lexicon Expressions
    var updateLexiconParams = {
      description: retrievedLexicon.description,
      lexiconExpressions: lexiconExpressions,
      id: updateTermsParams.termListId,
      name: retrievedLexicon.name
    };
    return lexiconModel.update(updateTermsParams.project_id, updateLexiconParams, updateTermsParams.overwrite);
  })
  .then(function(){
    deferredUpdate.resolve({});
  })
  .fail(function(errorResponse){
    deferredUpdate.reject(errorResponse);
  }).done();
  
  return deferredUpdate.promise;
}