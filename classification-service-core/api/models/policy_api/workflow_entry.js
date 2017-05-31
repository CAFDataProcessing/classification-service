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
//class for interaction with Policy API for type 'sequence_workflow_entry'
var pagingHelper = require('../../helpers/pagingHelper.js');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');

module.exports = {
  getWorkflowEntriesByWorkflowId,
  getWorkflowEntriesByWorkflowIdAndCollectionSequenceId,
  getWorkflowEntries
};

//returns a params object with common parameters for a Workflow entry. Takes in a project ID and uses that in the params.
var getDefaultParams = function(projectId){
  return {
    project_id: projectId,
    type: "sequence_workflow_entry"
  };
};

//Returns a promise to retrieve Workflow Entries for a specified Workflow ID. Default number of entries returned is 100
//project_id  - project_id to use in retrieving entries
//workflowId  - Workflow ID that entries must be under
//pageNum     - Optional. The page number to return results from. Defaults to 1.
//pageSize    - Optional. The max number of entries to return. Defaults to 100.
function getWorkflowEntriesByWorkflowId(project_id, workflowId, pageNum, pageSize){
  var additional = {
    filter: {
      sequence_workflow_id: workflowId
    }
  };
  return getWorkflowEntries(project_id, additional, pageNum, pageSize);
}


//Returns a promise to retrieve workflow entries for a particular Workflow ID and Collection Sequence ID. Default number of entries returned is 100.
function getWorkflowEntriesByWorkflowIdAndCollectionSequenceId(project_id, workflowId, colSeqId, pageNum, pageSize){
  var additional = {
    filter: {
      "sequence_workflow_id": workflowId,
      "collection_sequence.id": colSeqId
    }
  };  
  
  return getWorkflowEntries(project_id, additional, pageNum, pageSize);
}

//Returns a promise to retrieve workflow entries. object to set for 'additional' property may be passed as second argument. Default number of entries returned is 100.
function getWorkflowEntries(project_id, additional, pageNum, pageSize){
  var pageOptions = pagingHelper.getValidatedPagingParams(pageNum, pageSize);
  var getWorkflowEntriesParams = getDefaultParams(project_id);
  if(additional!==null && additional!==undefined){
    getWorkflowEntriesParams.additional = additional;
  }
  getWorkflowEntriesParams.max_page_results = pageOptions.pageSize;
  getWorkflowEntriesParams.start = pageOptions.start;

  return policyHttpHelper.genericPolicyAPIGetItemsRequest("workflow/retrieve", getWorkflowEntriesParams);
}