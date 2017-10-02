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
var logger = require('../logging/logging.js');
var httpHelper = require('../helpers/httpPromiseHelper.js');
var projectIdProvider = require('../libs/projectIdProvider.js');
var termsModel = require('../models/terms.js');

module.exports = {
  deleteTerm: deleteTerm,
  deleteTerms: deleteTerms,
  getTerm: getTerm,
  getTerms: getTerms,
  updateTerm: updateTerm,
  updateTerms: updateTerms
};

function deleteTerm(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteParams = {
    id: req.swagger.params.id.value,
    project_id: project_id,
    termListId: req.swagger.params.termListId.value    
  };
  logger.info(function(){return 'Deleting Term using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = termsModel.delete(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function deleteTerms(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteTermsParams = {
    project_id: project_id,
    termListId: req.swagger.params.termListId.value,
    terms: req.swagger.params.termIds.value.termIds    
  };
  logger.info(function(){return 'Deleting Terms using parameters: '+ JSON.stringify(deleteTermsParams);});
  var deletePromise = termsModel.deleteTerms(deleteTermsParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function getTerm(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getTermParams = {
    id: req.swagger.params.id.value,
    project_id: project_id,
    termListId: req.swagger.params.termListId.value
  }
  logger.info(function(){return 'Retrieving Term using parameters: '+ JSON.stringify(getTermParams);});
  var getPromise = termsModel.get(getTermParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function getTerms(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getTermsParams = {
    pageNum: req.swagger.params.pageNum.value,
    pageSize: req.swagger.params.pageSize.value,
    project_id: project_id,
    termListId: req.swagger.params.termListId.value
  };
  logger.info(function(){return 'Retrieving Terms using parameters: '+ JSON.stringify(getTermsParams);});
  var getPromise = termsModel.getTerms(getTermsParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function updateTerm(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateParams = {
    expression: req.swagger.params.updatedTerm.value.expression,
    id: req.swagger.params.id.value,
    project_id: project_id,
    termListId: req.swagger.params.termListId.value,
    type: req.swagger.params.updatedTerm.value.type
  }
  logger.info(function(){return 'Updating Term using parameters: '+ JSON.stringify(updateParams);});
  var updatePromise = termsModel.update(updateParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}

function updateTerms(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateTermsParams = {
    overwrite: req.swagger.params.terms.value.overwrite,
    project_id: project_id,
    terms: req.swagger.params.terms.value.terms,
    termListId: req.swagger.params.termListId.value
  };
  logger.info(function(){return 'Updating Terms using parameters: '+ JSON.stringify(updateTermsParams);});
  var updatePromise = termsModel.updateTerms(updateTermsParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}