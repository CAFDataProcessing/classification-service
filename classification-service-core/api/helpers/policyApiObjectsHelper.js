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
//holds functions for manipulation of objects specific to the Policy API
var logger = require('../logging/logging.js');
var apiErrorFactory = require('../models/errors/apiErrorFactory.js');

module.exports = {
  addChildToCondition: addChildToCondition,
  checkConditionHasChildrenProperty: checkConditionHasChildrenProperty,
  checkLexiconExpressionsIdsOnLexicon: checkLexiconExpressionsIdsOnLexicon,
  getConditionByIdFromClassificationRuleRootCondition: getConditionByIdFromClassificationRuleRootCondition,
  insertCollectionSequenceIntoWorkflowEntries: insertCollectionSequenceIntoWorkflowEntries,
  removeAllCollectionEntriesFromCollectionSequence: removeAllCollectionEntriesFromCollectionSequence,
  removeCollectionEntryFromCollectionSequence: removeCollectionEntryFromCollectionSequence,
  removeCollectionSequenceFromWorkflowEntries: removeCollectionSequenceFromWorkflowEntries,
  updateOrderOnWorkflowEntries: updateOrderOnWorkflowEntries,
};

//convenience method to add a condition to another condition object as a child. Updates the object passed in.
function addChildToCondition(conditionToAddTo, childCondition){
  if(!conditionToAddTo.hasOwnProperty('additional')){
    throw new Error("Condition must have 'additional' property defined.");
  }
  if(!conditionToAddTo.additional.hasOwnProperty('children')){
    throw new Error("Condition must have 'additional.children' property defined.");
  }
  conditionToAddTo.additional.children.push(childCondition);
}

//checks the structure of a condition object to ensure it is a boolean condition with the 'children' property. Returns false if this does not meet criteria 
function checkConditionHasChildrenProperty(conditionToCheck){
  if(conditionToCheck===null){
    logger.error("Policy condition passed is null");
    return false;
  }
  if(!conditionToCheck.hasOwnProperty('additional')){
    logger.error("Policy condition passed has no 'additional' property: "+JSON.stringify(conditionToCheck));
    return false;
  }
  if(conditionToCheck.additional.type !== 'boolean'){
    logger.error("Policy condition passed is not of type 'boolean': "+JSON.stringify(conditionToCheck));
    return false;
  }
  if(!conditionToCheck.additional.hasOwnProperty('children')){
    logger.error("Policy condition passed has no 'additional.children' property: "+JSON.stringify(conditionToCheck));
    return false;
  }
  return true;
}

//looks for the presence of Lexicon Expression IDs on a provided Lexicon. Returns an array containing any IDs that were not found.
//lexicon - the lexicon object from Policy API to check for Expression IDs, needs to have additional.lexicon_expressions set.
//idsToCheck - array of lexicon expression IDs to look for.
function checkLexiconExpressionsIdsOnLexicon(lexicon, idsToCheck){
  if(lexicon===null || lexicon===undefined || lexicon.additional===null || lexicon.additional===undefined || lexicon.additional.lexicon_expressions===null || lexicon.additional.lexicon_expressions===undefined){
    logger.info("Invalid lexicon passed to checkLexiconExpressionsIdsOnLexicon: "+JSON.stringify(lexicon));
    throw apiErrorFactory.createInvalidArgumentError("Invalid 'lexicon' argument passed.");
  }
  if(idsToCheck===null || idsToCheck===undefined){
    logger.info("Invalid idsToCheck passed to checkLexiconExpressionsIdsOnLexicon: "+JSON.stringify(idsToCheck));
    throw apiErrorFactory.createInvalidArgumentError("Invalid 'idsToCheck' argument passed.");
  }
  var lexiconExpressions = lexicon.additional.lexicon_expressions;
  if(lexiconExpressions.length===0){
    //no expressions on Lexicon is not an error state if caller provided no IDs
    if(idsToCheck.length===0){
      logger.debug("No Lexicon Expressions on Lexicon and no IDs were passed to check on Lexicon");
      return [];
    }
    else {
      logger.debug("No Lexicon Expressions on Lexicon but IDs were passed to check if they were on it: "+JSON.stringify(idsToCheck));
      return idsToCheck.slice();
    }
  }
  var notFoundIDs = [];
  var expressionIdsPresent = {};
  //build map of the IDs on the Lexicon to avoid multiple iterations (some use cases have 1000's of Lexicon Expressions on a Lexicon)
  lexiconExpressions.map(function(expression){
    expressionIdsPresent[expression.id]=true;
  });
  for(var idToCheck of idsToCheck){
    if(expressionIdsPresent[idToCheck]===true){
      continue;
    }
    notFoundIDs.push(idToCheck);
  }

  return notFoundIDs;
}

//takes in a Classification Rule Root condition and looks in its children for a Condition matching the ID passed in. Returns null if condition not found otherwise returns the matching condition.
function getConditionByIdFromClassificationRuleRootCondition(conditionObject, idToFind){
  var isValid = checkConditionHasChildrenProperty(conditionObject);
  if(!isValid){
    logger.error("Policy condition passed as Root Rule condition was not valid.");
    throw "Unable to retrieve condition.";
  }
  if(conditionObject.additional.children===null){
    logger.warn("Policy condition passed as Root Rule condition has 'children' set to null.");
    return null;
  }
  for(var childCondition of conditionObject.additional.children){
    if(childCondition === null || childCondition.additional===undefined || childCondition.additional===null){
      logger.warn(function(){return "Child condition on Classification Rule Root condition is not valid. It will be ignored. Root condition: "+JSON.stringify(conditionObject);});
    }
    
    if(childCondition.id===idToFind){
      return childCondition;
    }    
    //if this is a boolean condition check its children also
    if(childCondition.additional.type === 'boolean'){
      var nestedConditionsResult = getConditionByIdFromClassificationRuleRootCondition(childCondition, idToFind);
      if(nestedConditionsResult!==null){
        return nestedConditionsResult;
      }
    }
  }  
  return null;
}

//adds an entry to the specified workflow for the given collection sequence ID. Returns the inserted entry.
//workflow - the workflow object to update with the new entry
//collectionSequenceId - Id of the collection sequence to add as an entry
//order - Optional. The order to set on the entry. If none provided then the order will be set to the highest order of the entries on the Workflow + 1.
function insertCollectionSequenceIntoWorkflowEntries(workflow, collectionSequenceId, order){
  var newEntry = {
    collection_sequence_id: collectionSequenceId,
    sequence_workflow_id: workflow.id
  };
  
  //if an order was passed we set entry to use that order and increment existing entries greater than that order by 1, otherwise set the order to the highest order + 1
  if(order!==null && order!==undefined){
    newEntry.order = order;
    for(var entry of workflow.additional.sequence_entries){
      if(entry.order >= order){
        entry.order++;
      }
    }
  }
  else{
    //find the current highest order
    var highestOrder = 0;
    for(var entry of workflow.additional.sequence_entries){
      if(entry.order > highestOrder){
        highestOrder = entry.order;
      }
    }
    newEntry.order = highestOrder + 1;
  }
  //add to the list of entries
  workflow.additional.sequence_entries.push(newEntry);
  return newEntry;
}

function removeAllCollectionEntriesFromCollectionSequence(collectionSequence){
  collectionSequence.additional.collection_sequence_entries = [];
}

//Takes in an array of collection entries and removes any entries for the collection ids matching the passed in ID.
function removeCollectionEntryFromCollectionSequence(collectionEntries, collectionIdToRemove){
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

//removes an entry from specified workflow object matching given collection sequence ID. Returns the removed entry or null if no matching entry found.
//workflow - the workflow object to update.
//collectionSequenceId - the Id of the collection sequence on the entry to be removed.
function removeCollectionSequenceFromWorkflowEntries(workflow, collectionSequenceId){
  //find the entry
  
  var removedEntry = null;
  for(var index =0; index < workflow.additional.sequence_entries.length; index++){
    if(workflow.additional.sequence_entries[index].collection_sequence_id===collectionSequenceId){
      //remove the entry at this position from the entries array
      removedEntry = workflow.additional.sequence_entries.splice(index, 1);
      break;
    }
  }
  return removedEntry;
}

//updates the 'order' property of the entry on the workflow object passed, identified by the collection sequence ID argument passed.
function updateOrderOnWorkflowEntries(workflow, colSeqId, newOrder){
  for(var entry of workflow.additional.sequence_entries){
    if(entry.collection_sequence_id===colSeqId){
      entry.order = newOrder;
    }
  }
}