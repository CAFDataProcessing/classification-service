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
//this represents the data processing service Workflow and operations on that type.
var Q = require('q');
var policyWorkflowModel = require('./policy_api/workflow.js');
var toClassificationApiHelper = require('../helpers/policyApiToClassificationApiHelper.js');

module.exports = {
  create: create,
  delete: deleteWorkflow,
  get: get,
  getWorkflows: getWorkflows,
  update: update
};

function create(createWorkflowParams){
  var createPolicyWorkflowParams = {
    description: createWorkflowParams.description,
    name: createWorkflowParams.name,
    notes: createWorkflowParams.notes
  };
  var deferredCreate = Q.defer();
  policyWorkflowModel.create(createWorkflowParams.project_id, createPolicyWorkflowParams)
  .then(function(createdWorkflow){
    var builtWorkflow = toClassificationApiHelper.buildWorkflowFromPolicyWorkflow(createdWorkflow);
    deferredCreate.resolve(builtWorkflow);
  })
  .fail(function(errorResponse){
    deferredCreate.reject(errorResponse);
  }).done();
  return deferredCreate.promise;
}

function deleteWorkflow(deleteWorkflowParams){
  var deferredDelete = Q.defer();
    
  policyWorkflowModel.validateWorkflowExists(deleteWorkflowParams.project_id, deleteWorkflowParams.id)
  .then(function(retrievedWorkflow){
    //having retrieved the workflow, check for any Collection Sequence Entries on it (Rules).
    if(retrievedWorkflow.additional.sequence_entries !== undefined && retrievedWorkflow.additional.sequence_entries.length > 0){
      //TODO current implementation is set to throw an Error when Workflow has Rules, rather than delete Rules and Actions, until CAF-1436 completed.
      deferredDelete.reject("Unable to Delete. There are Classification Rules on the Workflow.");
      return Q({complete: true});
    }
    return Q({});
  })
  .then(function(result){
    //handles case where logic flow has completed earlier in the sequence
    if(result.complete){
      return Q({complete: true});
    }
    //delete the Workflow
    return policyWorkflowModel.deleteWorkflowById(deleteWorkflowParams.project_id, deleteWorkflowParams.id);
  })
  .then(function(result){
    if(result.complete){
      return Q({complete: true});
    }
    deferredDelete.resolve(result);
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();

  return deferredDelete.promise;
}

function get(getWorkflowParams){
  var deferredGet = Q.defer();
  policyWorkflowModel.validateWorkflowExists(getWorkflowParams.project_id, getWorkflowParams.id)
  .then(function(retrievedPolWorkflow){
    var builtWorkflow = toClassificationApiHelper.buildWorkflowFromPolicyWorkflow(retrievedPolWorkflow);
    deferredGet.resolve(builtWorkflow);
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  return deferredGet.promise;
}

function getWorkflows(getWorkflowsParams){
  var deferredGetWorkflows = Q.defer();
  
  policyWorkflowModel.getWorkflows(getWorkflowsParams.project_id, getWorkflowsParams.pageNum, 
    getWorkflowsParams.pageSize)
  .then(function(retrievedWorkflows){
    var builtWorkflows = [];
    for(var polWorkflow of retrievedWorkflows.results){
      builtWorkflows.push(toClassificationApiHelper.buildWorkflowFromPolicyWorkflow(polWorkflow));
    }
    deferredGetWorkflows.resolve({
      totalHits: retrievedWorkflows.totalhits,
      workflows: builtWorkflows
    });
  })
  .fail(function(errorResponse){
    deferredGetWorkflows.reject(errorResponse);
  }).done();
  
  return deferredGetWorkflows.promise;
}

function update(updateWorkflowParams){
  var deferredUpdate = Q.defer();
  
  //in updating the Workflow we need to retrieve the sequence entries on the Policy Workflow to pass in our update call
  //otherwise the Policy API will consider this as us removing all Workflow entries.
  policyWorkflowModel.validateWorkflowExists(updateWorkflowParams.project_id, updateWorkflowParams.id)
  .then(function(retrievedWorkflow){
    //use the additional information retrieved to update the Workflow without removing the entries
    var updatePolWorkflowParams = {
      description: updateWorkflowParams.description,
      id: updateWorkflowParams.id,
      name: updateWorkflowParams.name,
      additional: {
        notes: updateWorkflowParams.notes,
        sequence_entries: retrievedWorkflow.additional.sequence_entries
      }
    };    
    return policyWorkflowModel.update(updateWorkflowParams.project_id, updatePolWorkflowParams);
  })
  .then(function(updatedPolWorkflow){
    deferredUpdate.resolve(updatedPolWorkflow);
  })
  .fail(function(errorResponse){
    deferredUpdate.reject(errorResponse);
  }).done();
  return deferredUpdate.promise;
}