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
//holds functions for manipulation of objects specific to the Classification API
var logger = require('../logging/logging.js');

module.exports = {
  classifications: {
    associateConditionWithPolicy: associateConditionWithPolicyForClassification,
    associatePolicyWithCondition: associatePolicyWithConditionForClassification,
    buildPolicyDescriptionFromObject: buildPolicyDescriptionFromObject,
    extractPropertiesFromPolicyDescription: extractPropertiesFromPolicyDescription,
    getConditionIdFromPolicy: getConditionIdFromClassificationPolicy,
    getPolicyIdFromCondition: getPolicyIdFromClassificationCondition,
    getTermListIdsOnClassification: getTermListIdsOnClassification,
    markConditionAsClassification: markConditionAsClassification,
    notesValue: classificationNotesValue
  },
  conditions: {
    getRuleConditionFromDetailedCollectionSequence: getRuleConditionFromDetailedCollectionSequence,
    getTermListIdsOnCondition: getTermListIdsOnCondition
  },
  rules: {
    getNewRuleRootLevelCondition: getNewRuleRootLevelCondition,
    getClassificationRuleNotesValue: getClassificationRuleNotesValue,
    getRulePrioritiesFromPolicyWorkflow: getRulePrioritiesFromPolicyWorkflow
  },
  ruleClassifications: {
    buildNameFromIds: buildNameFromIds,
    getNewRootLevelCondition: getNewRuleClassificationRootLevelCondition,
    getRuleClassificationCondition: getRuleClassificationCondition,
    getRuleRootFragmentCondition: getRuleRootFragmentCondition
  }
};

var conditionNamePrefix = "CLASSIFICATION_POLICY_ID:";
var policyNamePrefix= "CLASSIFICATION_CONDITION_ID:";
var classificationNotesValue = 'API_CLASSIFICATION';
var classificationRulePrefix = "API_CLASSIFICATION_RULE_ID:";
var ruleClassificationCondition = "API_CLASSIFICATION_RULE_CLASSIFICATION";
var ruleRootConditionPointer = "API_CLASSIFICATION_CLASSIFICATION_RULE_ROOT";
var ruleClassificationRootCondition = "API_CLASSIFICATION_RULE_CLASSIFICATION_ROOT";

//takes in a Condition object and updates it to have reference to passed in Policy ID
function associateConditionWithPolicyForClassification(condition, policyId){
  condition.name = getConditionNameForClassification(policyId);
}

//takes in a Policy object and updates it to have reference to passed in Condition ID
function associatePolicyWithConditionForClassification(policy, conditionId){
  policy.name = getPolicyNameForClassification(conditionId);
}

//returns a name comprised of the Workflow ID, Classification Rule ID and Classification ID passed in. For use on Rule Classifications.
function buildNameFromIds(workflowId, classificationRuleId, classificationId){
  return "API_CLASSIFICATION_WORKFLOW:"+workflowId+
  ":CLASSIFICATION_RULE:"+classificationRuleId+
  ":CLASSIFICATION:"+classificationId;
}

//takes in 'name', 'description' and 'type' properties and returns a single Object that can be used as the 'description' property for a Policy.
function buildPolicyDescription(name, description, type){
  return JSON.stringify(JSON.stringify({
    "name": name,
    "description": description,
    "type": type
  }));
}

//takes in an object and extracts relevant properties returning them as JSON Object that can be set as Policy 'description'
function buildPolicyDescriptionFromObject(objectWithProperties){
  return buildPolicyDescription(objectWithProperties.name, objectWithProperties.description, objectWithProperties.type);
}

//generic function for use with Classification associated Conditions and Policies that extracts an ID from a given string, using the provided prefix. Returns null if unable to extract ID.
function extractIdFromString(strToExtractFrom, prefix){  
  if(strToExtractFrom === null || strToExtractFrom === undefined || strToExtractFrom.indexOf(prefix)===-1){
    return null;
  }
  var extractedId = strToExtractFrom.substr(prefix.length);
  if(extractedId.length===0 || isNaN(Number(extractedId))){
    return null;
  }
  return extractedId;
}

//decodes the policyDescription passed into object and returns those properties. If objectToSetPropertiesOn passed the properties will be set on that object as well as returned.
function extractPropertiesFromPolicyDescription(policyDescription, objectToSetPropertiesOn){
  var propertyHolder = objectToSetPropertiesOn===undefined || objectToSetPropertiesOn===null ? {} : objectToSetPropertiesOn;
  var decodedObject;
  try{
    decodedObject = JSON.parse(JSON.parse(policyDescription));
  }
  catch(parseError){
    logger.error("Error trying to parse Policy Description to object: "+policyDescription);
    throw "Unable to extract properties from Policy Description";
  }
  propertyHolder.description = decodedObject.description;
  propertyHolder.name = decodedObject.name;
  propertyHolder.type = decodedObject.type;
  return propertyHolder;
}

//extracts the ID of the Condition associated with the passed in Policy. Returns null if unable to extract ID.
function getConditionIdFromClassificationPolicy(policy){
  return getConditionIdFromClassificationPolicyName(policy.name);
}

//extracts the ID of the Condition from the passed in name. Returns null if unable to extract ID.
function getConditionIdFromClassificationPolicyName(policyName){
  return extractIdFromString(policyName, policyNamePrefix);
}

//extracts the ID of the Policy associated with the passed in Condition. Returns null if unable to extract ID.
function getPolicyIdFromClassificationCondition(condition){
  return getPolicyIdFromClassificationConditionName(condition.name);
}

//extracts the ID of the Policy from the passed in name. Returns null if unable to extract ID.
function getPolicyIdFromClassificationConditionName(conditionName){
  return extractIdFromString(conditionName, conditionNamePrefix);
}

//used to construct the name for a Condition that is part of a Classification. Takes in the associated Policy ID and builds the name using that value.
function getConditionNameForClassification(policyId){
  return conditionNamePrefix + policyId;
}

//used to construct the name for a Policy that is part of a Classification. Takes in the associated Condition ID and builds the name using that value.
function getPolicyNameForClassification(conditionId){
  return policyNamePrefix + conditionId;
}

//takes in a fully detailed Collection Sequence object (from a get with 'include_children=true') and returns the Rule Condition. The Rule Condition will only be present if a Classification exists on the Classification Rule (that Classification will refer to the Rule fragment). Returns null if no Rule condition can be found.
function getRuleConditionFromDetailedCollectionSequence(collectionSequenceObject){
  if(!collectionSequenceObject.hasOwnProperty('additional')){
    logger.warn("Collection Sequence passed when trying to retrieve Classification Rule condition has no 'additional' property.");
    return null;
  }
  if(!collectionSequenceObject.additional.hasOwnProperty('condition_fragments')){
    logger.warn("Collection Sequence passed when trying to retrieve Classification Rule condition has no 'additional.condition_fragments' property.");
    return null;
  }
  if(collectionSequenceObject.additional.condition_fragments.length===0){
    return null;
  }
  var collectionSequenceId = collectionSequenceObject.id;
  var ruleNotesValue = getClassificationRuleNotesValue(collectionSequenceId);
  for(var conditionFragment of collectionSequenceObject.additional.condition_fragments){
    if(conditionFragment.additional.notes===ruleNotesValue){
      return conditionFragment;
    }
  }
  return null;
}

//Takes in the ID of a condition associated with a Classification and returns a Fragment Condition pointing to that ID
function getRuleClassificationCondition(conditionId){
  return {
    "type": "condition",
    "name": ruleClassificationCondition,
    "additional": {
      "type": "fragment",
      "value": conditionId
    },
    "notes": ruleClassificationCondition
  };
}

function getRuleRootFragmentCondition(ruleRootConditionId){
  return {
    "type": "condition",
    "name": ruleRootConditionPointer,
    "additional": {
      "type": "fragment",
      "value": ruleRootConditionId
    },
    "notes": ruleRootConditionPointer
  };
}

//Root condition that the Classification and Classification Rule Condition fragments should be added to on a Rule Classification
function getNewRuleClassificationRootLevelCondition(){
  return {
    "type": "condition",
    "name": ruleClassificationRootCondition,
    "additional": {
      "type": "boolean",
      "operator": "and",
      "children": [
      ]
    },
    "notes": ruleClassificationRootCondition
  };
}

function getTermListIdsOnObject(objectToCheck, invalidAdditionalMessage, invalidTermListTypeDefinitionMessage,
  invalidBooleanTypeDefinitionMessage){
  var encounteredTermListIds = {};
  var termListIdsToReturn = [];
  if(objectToCheck===null || objectToCheck===undefined || objectToCheck.additional===null || objectToCheck.additional===undefined){
    logger.warn(invalidAdditionalMessage);
    return termListIdsToReturn;
  }
  if(objectToCheck.additional.type==='termlist' || objectToCheck.additional.type==='lexicon'){
    if(objectToCheck.additional.value===undefined || objectToCheck.additional.value===null){
      throw invalidTermListTypeDefinitionMessage;
    }
    termListIdsToReturn.push(objectToCheck.additional.value);
    return termListIdsToReturn;
  }
  //check for any child conditions that may be termlists
  if(objectToCheck.additional.type==='boolean'){
    var childConditions = objectToCheck.additional.children;
    if(childConditions===null || childConditions===undefined){
      //possible to pass no value for 'children' signifying empty array.
      return termListIdsToReturn;
    }
    if(Array.isArray(childConditions)===false){
      throw invalidBooleanTypeDefinitionMessage;
    }
    for(var childCondition of childConditions){
      var extractedChildTermIds = getTermListIdsOnObject(childCondition, invalidAdditionalMessage, invalidTermListTypeDefinitionMessage,
  invalidBooleanTypeDefinitionMessage);
      //record all the extracted term IDs (object map handles duplicates naturally here)
      for(var termId of extractedChildTermIds){
        if(encounteredTermListIds[termId]!==true){
          encounteredTermListIds[termId] = true;
        }
        termListIdsToReturn.push(termId);
      }
    }
  }
  return termListIdsToReturn;
}

function getTermListIdsOnCondition(condition){
  return getTermListIdsOnObject(condition, "Condition passed to 'getTermListIdsOnCondition' had invalid 'additional' property, this is not a valid Condition.", "Invalid 'termlist' type definition on Condition 'additional'.",
  "Invalid 'boolean' type definition on Condition 'additional', 'children' property should be an array.");
}

//takes in a classification object and searches for any 'termlist' type conditions specified on it. Returns the IDs that any termlist conditions refer to in their 'value' field.
function getTermListIdsOnClassification(classification){
  return getTermListIdsOnObject(classification, "Classification passed to 'getTermListIdsOnClassification' had invalid 'additional' property, this is not a valid Classification.", "Invalid 'termlist' type definition on Classification 'additional'.",
  "Invalid 'boolean' type definition on Classification 'additional', 'children' property should be an array.");
}

//records on the passed in object that this is a Classification. This will override any existing value set for the 'notes' property on 'additional'
function markConditionAsClassification(conditionObject){
  if(conditionObject===null || conditionObject===undefined){
    logger.error("No Condition was passed to 'markConditionAsClassification' method.");
    throw Error("Unable to mark as Classification.");
  }
  if(conditionObject.additional===null || conditionObject===undefined){
    logger.error("Condition passed to 'markConditionAsClassification' method has no 'additional' property.");
    throw Error("Unable to mark as Classification.");
  }
  conditionObject.additional.notes = classificationNotesValue;
}

//Returns the value that would be in a Root Rule Condition notes field for the specified Rule ID
function getClassificationRuleNotesValue(ruleId){
  return classificationRulePrefix + ruleId;
}

//Returns an object that represents a Policy Condition with a root condition referring to a specified Rule that will always match any document evaluated against it. Additional conditions should be added as children of the root.
function getNewRuleRootLevelCondition(ruleId){
  return {
    "type": "condition",
    "name": getClassificationRuleNotesValue(ruleId),
    "additional": {
      "type": "boolean",
      "operator": "and",
      "children": [
      ],
      "notes": getClassificationRuleNotesValue(ruleId)
    }    
  };
}

//given a Policy Workflow object that has sequence_entries, returns a map of Rule IDs to priorities. Returns empty object if no entries on Workflow.
function getRulePrioritiesFromPolicyWorkflow(workflow){
  if(workflow===undefined || workflow===null || 
    workflow.additional===undefined || workflow.additional===null || 
    workflow.additional.sequence_entries===undefined || workflow.additional.sequence_entries===null ||
    workflow.additional.sequence_entries.length===0){
    return {};
  }
  var rulesMap = {};
  for(var entry of workflow.additional.sequence_entries){
    rulesMap[entry.collection_sequence_id] = entry.order;
  }
  return rulesMap;
}