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
var classificationsModel = require('../models/classifications.js');

module.exports = {
  createClassification,
  deleteClassification,
  getClassification,
  getClassifications,
  updateClassification
};

function createClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var createParams = {
    additional: req.swagger.params.newClassification.value.additional,
    classificationTarget: req.swagger.params.newClassification.value.classificationTarget,
    description: req.swagger.params.newClassification.value.description,
    name: req.swagger.params.newClassification.value.name,
    project_id: project_id,
    type: req.swagger.params.newClassification.value.type
  };
  logger.info(function(){return 'Creating Classification using parameters: '+ JSON.stringify(createParams);});
  var createPromise = classificationsModel.create(createParams);  
  httpHelper.writeCreatePromiseJSONResultToResponse(createPromise, response);
}

function deleteClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var deleteParams = {
    id: req.swagger.params.id.value,
    project_id: project_id
  };
  logger.info(function(){return 'Deleting Classification using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = classificationsModel.delete(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function getClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    id: req.swagger.params.id.value,
    project_id: project_id
  };
  logger.info(function(){return 'Retrieving Classification using parameters: '+ JSON.stringify(getParams);});
  var getPromise = classificationsModel.get(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function getClassifications(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getParams = {
    pageNum: req.swagger.params.pageNum.value,
    pageSize: req.swagger.params.pageSize.value,
    project_id: project_id
  };
  logger.info(function(){return 'Retrieving Classifications using parameters: '+ JSON.stringify(getParams);});
  var getPromise = classificationsModel.getClassifications(getParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function updateClassification(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateParams = {
    additional: req.swagger.params.updatedClassification.value.additional,
    classificationTarget: req.swagger.params.updatedClassification.value.classificationTarget,
    description: req.swagger.params.updatedClassification.value.description,
    id: req.swagger.params.id.value,
    name: req.swagger.params.updatedClassification.value.name,
    project_id: project_id,
    type: req.swagger.params.updatedClassification.value.type
  };
  logger.info(function(){return 'Updating Classification using parameters: '+ JSON.stringify(updateParams);});
  var updatePromise = classificationsModel.update(updateParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}