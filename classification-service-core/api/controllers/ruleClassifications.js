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
var ruleClassificationsModel = require('../models/ruleClassifications.js');

module.exports = {
  createRuleClassification,
  deleteRuleClassification,
  deleteRuleClassifications,
  getRuleClassification,
  getRuleClassifications,
  updateRuleClassification
}

function createRuleClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var createParams = {
    classificationId: req.swagger.params.newRuleClassification.value.classificationId,
    classificationRuleId: req.swagger.params.classificationRuleId.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Creating Rule Classification using parameters: '+ JSON.stringify(createParams);});
  var createPromise = ruleClassificationsModel.create(createParams);  
  httpHelper.writeCreatePromiseJSONResultToResponse(createPromise, response);
}

function deleteRuleClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteParams = {
    classificationRuleId: req.swagger.params.classificationRuleId.value,
    id: req.swagger.params.id.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Deleting Rule Classification using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = ruleClassificationsModel.delete(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function deleteRuleClassifications(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteParams = {
    classificationRuleId: req.swagger.params.classificationRuleId.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Deleting Rule Classifications using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = ruleClassificationsModel.deleteAll(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function getRuleClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    classificationRuleId: req.swagger.params.classificationRuleId.value,
    id: req.swagger.params.id.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Retrieving Rule Classification using parameters: '+ JSON.stringify(getParams);});
  var getPromise = ruleClassificationsModel.get(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function getRuleClassifications(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    classificationRuleId: req.swagger.params.classificationRuleId.value,
    pageNum: req.swagger.params.pageNum.value,
    pageSize: req.swagger.params.pageSize.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Retrieving Rule Classifications using parameters: '+ JSON.stringify(getParams);});
  var getPromise = ruleClassificationsModel.getRuleClassifications(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function updateRuleClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateParams = {
    classificationRuleId: req.swagger.params.classificationRuleId.value,
    id: req.swagger.params.id.value,
    project_id: project_id,
    updatedRuleClassification: req.swagger.params.updatedRuleClassification.value,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Updating Rule Classification using parameters: '+ JSON.stringify(updateParams);});
  var updatePromise = ruleClassificationsModel.update(updateParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}