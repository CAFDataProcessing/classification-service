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
var Q = require('q');
var policyHttpHelper = require('../../helpers/policyHttpHelper.js');
var apiErrorFactory = require('../errors/apiErrorFactory.js');
var pagingHelper = require('../../helpers/pagingHelper.js');

module.exports = {
  create: create,
  createCollectionEntry: createCollectionEntry,
  defaults: {
    updateBehaviour: {
      add: 'ADD',
      replace: 'REPLACE'
    }
  },
  delete: deleteSequence,
  get: get,
  getAllDetails: getAllDetails,
  getCollectionIdsFromEntries: getCollectionIdsFromEntries,
  getCollectionSequencesByIds: getCollectionSequencesByIds,
  removeCollectionEntry: removeCollectionEntry,
  update: update,
  updateCollectionSequenceWithEntryForCollection: updateCollectionSequenceWithEntryForCollection,
  validateSequenceExists: validateSequenceExists
};

//returns a params object with common parameters for Collection. Takes in a project ID and uses that in the params.
var getDefaultParams = function(projectId){
  return {
    project_id: projectId,
    type: "collection_sequence"
  };
};

//deletes the collection sequence matching the provided ID. Returns a promise.
function deleteSequence(projectId, collectionSequenceId){
  var deleteCollectionSequenceParams = getDefaultParams(projectId);
  deleteCollectionSequenceParams.id = collectionSequenceId;

  var deferredDelete = Q.defer();
  var deletePromise = policyHttpHelper.genericPolicyAPIPostItemRequest("classification/delete", deleteCollectionSequenceParams);
  deletePromise.then(function(result){
    //if Policy API can't delete it returns 200 status and a body conveying error.
    httpHelper.handleDeleteResponseAndThrow(result);
    deferredDelete.resolve(result)
  })
  .fail(function(errorResponse){
    deferredDelete.reject(errorResponse);
  }).done();
}
//creates a collection sequence using the provided parameter object. Returns a promise.
function create(projectId, collectionSequence){
  var createCollectionSequenceParams = getDefaultParams(projectId);
  createCollectionSequenceParams.name = collectionSequence.name;
  createCollectionSequenceParams.description = collectionSequence.description;
  createCollectionSequenceParams.additional = {
    evaluation_enabled: collectionSequence.enabled
  };

  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/create", createCollectionSequenceParams);
}

//gets a collection sequence matching the specified ID. Returns a promise.
function get(projectId, collectionSequenceId, getAllDetails){
  var getCollectionSequenceParams = getDefaultParams(projectId);
  getCollectionSequenceParams.id = collectionSequenceId;

  if(getAllDetails===true){
    getCollectionSequenceParams.additional = {
      include_children: true
    };
  }
  
  return policyHttpHelper.genericPolicyAPIGetItemRequest("classification/retrieve", getCollectionSequenceParams);
}

//gets details for a collection sequence matching the specified ID, returning details of the sequence, the policies on it, collection entries, condition fragments on it and any Policy Types it is using.
function getAllDetails(projectId, collectionSequenceId){
  return get(projectId, collectionSequenceId, true);
}

//gets collection sequences that match the specified array of IDs. 'allDetails' may be passed as 'true' to retrieve the details of Collections, Conditions and Policies on each Sequence (defaults to false). Supports paging of these sequences. Returns a promise.
function getCollectionSequencesByIds(projectId, ids, pageNum, pageSize, allDetails){
  var getParams = getDefaultParams(projectId);
  var pageOptions = pagingHelper.getValidatedPagingParams(pageNum, pageSize);
  if(ids!==undefined && ids!==null){
    getParams.id = ids;
  }
  getParams.additional = {
    include_children: allDetails
  };
  getParams.max_page_results = pageOptions.pageSize;
  getParams.start = pageOptions.start;
  
  return policyHttpHelper.genericPolicyAPIGetItemsRequest("classification/retrieve", getParams);
}

//updates a collection sequence with passed in object properties. If 'updateBehaviour' passed then the update on children of the collection sequence can be either 'ADD' or 'REPLACE'.
function update(projectId, collectionSequence, updateBehaviour){
  var updateCollectionSequenceParams = getDefaultParams(projectId);
  updateCollectionSequenceParams.id = collectionSequence.id;
  updateCollectionSequenceParams.name = collectionSequence.name;
  updateCollectionSequenceParams.description = collectionSequence.description;
  
  if(collectionSequence.additional){
    updateCollectionSequenceParams.additional = collectionSequence.additional;
  }
  else {
    updateCollectionSequenceParams.additional = {};
  }
  updateCollectionSequenceParams.additional.evaluation_enabled = collectionSequence.enabled;
  
  if(updateBehaviour!==undefined && updateBehaviour!==null){
    updateCollectionSequenceParams.update_behaviour =  updateBehaviour;
  }
  return policyHttpHelper.genericPolicyAPIPostItemRequest("classification/update", updateCollectionSequenceParams);
}

//updates a collection using the description, id and name on the details provided and an entry for the collection with the ID passed using the provided order.
function updateCollectionSequenceWithEntryForCollection(project_id, collectionSequenceDetails, collectionId, collectionOrder, updateBehaviour){
  //add this collection to the requested rule (col seq)    
    var updateCollectionSequenceParams = {
      description: collectionSequenceDetails.description,
      enabled: collectionSequenceDetails.additional.evaluation_enabled,
      id: collectionSequenceDetails.id,
      name: collectionSequenceDetails.name
    };
    
    var newCollectionEntry = createCollectionEntry(collectionId,
      collectionOrder);
    updateCollectionSequenceParams.additional = {
      collection_sequence_entries: [newCollectionEntry]
    };
    
    //call update sequence with 'add' update behaviour so this new collection entry is just added to the sequence rather than having to pass existing entries also as part of update.
    return update(project_id, updateCollectionSequenceParams, 
      updateBehaviour);   
}

//Constructs and returns an object representing a Collection Entry object on a Sequence using the parameters passed.
function createCollectionEntry(collectionId, order){
  return {
    collection_ids: [collectionId],
    order: order,
    stop_on_match: false
  };
}

//Takes in an array of collection entries and removes any entries for the collection ids matching the passed in ID.
function removeCollectionEntry(collectionEntries, collectionIdToRemove){
  for(var entryIndex =0; entryIndex<collectionEntries.length; entryIndex++){
    var collectionEntry = collectionEntries[entryIndex];
    //remove from the ids array on the entry
    var idofCollectionIdsEntry = collectionEntry.collection_ids.indexOf(collectionIdToRemove);
    if(idofCollectionIdsEntry!==-1){
      collectionEntry.collection_ids.splice(idofCollectionIdsEntry, 1);
    }
    //check if there are no other id entries on this entry, if there are none then we remove the entry itself
    if(collectionEntry.collection_ids.length === 0){
      collectionEntries.splice(entryIndex, 1);
    }
  }
}

//Retuns an array of Collection IDs that are present on the Collection Sequence Collection Entries passed.
function getCollectionIdsFromEntries(entries){
  var collectionIds = [];
  for(var entryIndex =0; entryIndex<collectionEntries.length; entryIndex++){
    var collectionEntry = collectionEntries[entryIndex];
    for(var collectionId of collectionEntry.collection_ids){
      if(collectionIds.indexOf(collectionId)===-1){
        collectionIds.push(collectionId);
      }
    }
  }
  return collectionIds;
}

//Returns a promise to check that a given Collection Sequence exists. Resolved result will be the retrieved Sequence (pass allDetails set to 'true' to return all details of the sequence)
function validateSequenceExists(projectId, colSeqId, allDetails, notFoundMessage){
  var validatedSequencePromise = Q.defer();
  var getSeqPromise = null;
  if(allDetails){
    getSeqPromise = getAllDetails(projectId, colSeqId);
  }
  else{
    getSeqPromise = get(projectId, colSeqId);
  }
  getSeqPromise.then(function(retrievedSeq){
    validatedSequencePromise.resolve(retrievedSeq);
  })
  .fail(function(errorResponse){
    //throwing a more helpful error here if indication is that the Rule ID was wrong.
    if(errorResponse.response && errorResponse.response.message === "No matching collection sequence exists."){ 
      validatedSequencePromise.reject(apiErrorFactory.createNotFoundError(notFoundMessage === undefined || notFoundMessage === null ? "Could not retrieve Collection Sequence with ID: "+colSeqId : notFoundMessage, errorResponse.response.correlation_code));
    }
    else {
      validatedSequencePromise.reject(errorResponse);
    }
  });
  return validatedSequencePromise.promise;
}