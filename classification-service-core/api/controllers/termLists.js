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
var termListModel = require('../models/termLists.js');

module.exports = {
  createTermList: createTermList,
  deleteTermList: deleteTermList,
  getTermList: getTermList,
  getTermLists: getTermLists,
  updateTermList: updateTermList
};

function createTermList(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);  
  var createTermListParams = {
    description: req.swagger.params.newTermList.value.description,
    name: req.swagger.params.newTermList.value.name,
    project_id: project_id
  };
  logger.info(function(){return 'Creating Term List using parameters: '+JSON.stringify(createTermListParams);});
  var createPromise = termListModel.create(createTermListParams);
  httpHelper.writeCreatePromiseJSONResultToResponse(createPromise, response);
}

function deleteTermList(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);  
  var deleteParams = {
    id: req.swagger.params.id.value,
    project_id: project_id
  };
  logger.info(function(){return 'Deleting Term List using parameters: '+ JSON.stringify(deleteParams);});
  var deletePromise = termListModel.delete(deleteParams);
  httpHelper.writeDeletePromiseJSONResultToResponse(deletePromise, response);
}

function getTermList(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);  
  var getTermListParams = {
    id: req.swagger.params.id.value,
    project_id: project_id
  };
  logger.info(function(){return 'Retrieving Term List using parameters: '+ JSON.stringify(getTermListParams);});
  var getPromise = termListModel.get(getTermListParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function getTermLists(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var getTermListParams = {
    pageNum: req.swagger.params.pageNum.value,
    pageSize: req.swagger.params.pageSize.value,
    project_id: project_id
  };
  logger.info(function(){return 'Retrieving Term Lists using parameters: '+ JSON.stringify(getTermListParams);});
  var getPromise = termListModel.getTermLists(getTermListParams);
  httpHelper.writePromiseJSONResultToResponse(getPromise, response);
}

function updateTermList(req, response, next){
  var project_id = projectIdProvider.getProjectId(null, req);
  var updateParams = {
    description: req.swagger.params.updatedTermList.value.description,
    id: req.swagger.params.id.value,
    name: req.swagger.params.updatedTermList.value.name,
    project_id: project_id
  };
  logger.info(function(){return 'Updating Term Lists using parameters: '+ JSON.stringify(updateParams);});
  var updatePromise = termListModel.update(updateParams);
  httpHelper.writeUpdatePromiseJSONResultToResponse(updatePromise, response);
}