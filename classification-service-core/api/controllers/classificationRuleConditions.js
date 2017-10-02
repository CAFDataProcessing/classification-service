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
var classificationRuleConditionsModel = require('../models/classificationRuleConditions.js');

module.exports = {
  createClassificationRuleCondition,
  deleteClassificationRuleCondition,
  getClassificationRuleCondition,
  getClassificationRuleConditions,
  updateClassificationRuleCondition
};

function createClassificationRuleCondition(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var createParams = {
    additional: req.swagger.params.newCondition.value.additional,
    classificationRuleId: req.swagger.params.ruleId.value,
    name: req.swagger.params.newCondition.value.name,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Creating Classification Rule using parameters: '+ JSON.stringify(createParams);});
  var createPromise = classificationRuleConditionsModel.create(createParams);  
  httpHelper.writeCreatePromiseJSONResultToResponse(createPromise, response);
}

function deleteClassificationRuleCondition(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteParams = {
    classificationRuleId: req.swagger.params.ruleId.value,
    id: req.swagger.params.conditionId.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Deleting Classification Rule Condition using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = classificationRuleConditionsModel.delete(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function getClassificationRuleCondition(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    classificationRuleId: req.swagger.params.ruleId.value,
    id: req.swagger.params.conditionId.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Retrieving Classification Rule Condition using parameters: '+ JSON.stringify(getParams);});
  var getPromise = classificationRuleConditionsModel.get(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function getClassificationRuleConditions(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    classificationRuleId: req.swagger.params.ruleId.value,
    pageNum: req.swagger.params.pageNum.value,
    pageSize: req.swagger.params.pageSize.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Retrieving Classification Rule Conditions using parameters: '+ JSON.stringify(getParams);});
  var getPromise = classificationRuleConditionsModel.getClassificationRuleConditions(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function updateClassificationRuleCondition(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateParams = {
    classificationRuleId: req.swagger.params.ruleId.value,
    id: req.swagger.params.conditionId.value,
    project_id: project_id,
    updatedRuleCondition: req.swagger.params.updatedRuleCondition.value,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Updating Classification Rule Condition using parameters: '+ JSON.stringify(updateParams);});
  var updatePromise = classificationRuleConditionsModel.update(updateParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}