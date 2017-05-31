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
var logger = require('../logging/logging.js');
var httpHelper = require('../helpers/httpPromiseHelper.js');
var projectIdProvider = require('../libs/projectIdProvider.js');
var classificationRulesModel = require('../models/classificationRules.js');

module.exports = {
  createClassificationRule,
  deleteClassificationRule,
  getClassificationRule,
  getClassificationRules,
  updateClassificationRule
};

function createClassificationRule(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var createParams = {
    description: req.swagger.params.newRule.value.description,
    name: req.swagger.params.newRule.value.name,
    priority: req.swagger.params.newRule.value.priority,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Creating Classification Rule using parameters: '+ JSON.stringify(createParams);});
  var createPromise = classificationRulesModel.create(createParams);  
  httpHelper.writeCreatePromiseJSONResultToResponse(createPromise, response);
}

function deleteClassificationRule(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteParams = {
    id: req.swagger.params.id.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Deleting Classification Rule using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = classificationRulesModel.delete(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function getClassificationRule(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    id: req.swagger.params.id.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Retrieving Classification Rule using parameters: '+ JSON.stringify(getParams);});
  var getPromise = classificationRulesModel.get(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function getClassificationRules(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    pageNum: req.swagger.params.pageNum.value,
    pageSize: req.swagger.params.pageSize.value,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Retrieving Classification Rules using parameters: '+ JSON.stringify(getParams);});
  var getPromise = classificationRulesModel.getClassificationRules(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function updateClassificationRule(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateParams = {    
    description: req.swagger.params.updatedRule.value.description,
    id: req.swagger.params.id.value,
    name: req.swagger.params.updatedRule.value.name,
    priority: req.swagger.params.updatedRule.value.priority,
    project_id: project_id,
    workflowId: req.swagger.params.workflowId.value
  };
  logger.info(function(){return 'Updating Classification Rule using parameters: '+ JSON.stringify(updateParams);});
  var updatePromise = classificationRulesModel.update(updateParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}