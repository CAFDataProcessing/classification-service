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
//holds methods to take objects in Policy API form and pull property values from them to construct Classification API representations
var logger = require('../logging/logging.js');
var classificationObjectsHelper = require('./classificationObjectsHelper.js').classifications;
var policyApiObjectsHelper = require('./policyApiObjectsHelper.js');

module.exports = {
  buildClassificationFromCondition: buildClassificationFromCondition,
  buildClassificationFromPolicy: buildClassificationFromPolicy,
  buildClassificationRuleFromCollectionSequenceAndOrder: buildClassificationRuleFromCollectionSequenceAndOrder,
  buildClassificationRuleFromCollectionSequence: buildClassificationRuleFromCollectionSequence,
  buildClassificationRuleFromWorkflowEntry: buildClassificationRuleFromWorkflowEntry,
  buildConditionFromPolicyCondition: buildConditionFromPolicyCondition,
  buildRuleClassificationFromCollectionAndClassificationId: buildRuleClassificationFromCollectionAndClassificationId,
  buildRuleClassificationFromCollection: buildRuleClassificationFromCollection,
  buildRuleConditionsFromRootRulePolicyCondition: buildRuleConditionsFromRootRulePolicyCondition,
  buildTermListFromLexicon: buildTermListFromLexicon,
  buildTermFromLexiconExpression: buildTermFromLexiconExpression,
  buildWorkflowFromPolicyWorkflow: buildWorkflowFromPolicyWorkflow
};

function buildClassificationFromCondition(condition, classification){
  var classificationToReturn = classification !== null && classification !== undefined ? classification : {};
  
  //need to extract the restructured 'additional' from a built Condition
  var builtCondition = buildConditionFromPolicyCondition(condition);
  classificationToReturn.classificationTarget = convertPolicyPropertiesToClassificationTarget(condition);
  classificationToReturn.additional = builtCondition.additional;
  //remove any notes field set on top level condition as it is reserved for use by API and shouldn't be exposed
  delete classificationToReturn.additional.notes;
    
  return classificationToReturn;
}

function buildClassificationFromPolicy(policy, classification){
  var classificationToReturn = classification !== null && classification !== undefined ? classification : {};
  
  classificationToReturn.id = policy.id;
  //extract properties from 'description' JSON object
  try{
    classificationObjectsHelper.extractPropertiesFromPolicyDescription(policy.description, classificationToReturn);
  }
  catch(error){
    logger.error("Failed to extract properties for Classification from Policy provided. Policy: "+ JSON.stringify(policy) + " Error was: "+error);
    throw Error("Unable to construct Classification");
  }  
  
  return classificationToReturn;
}

//updates a rule object with the relevant properties of passed in collection sequence and the passed in order value. Creates new object if no rule is passed.
function buildClassificationRuleFromCollectionSequenceAndOrder(collectionSequenceObject, order, ruleToUpdate){
  var ruleToReturn = buildClassificationRuleFromCollectionSequence(collectionSequenceObject, ruleToUpdate);
  ruleToReturn.priority = order;
  return ruleToReturn;
}

//updates a rule object with the relevant properties of passed in collection sequence. Creates new object if no rule is passed.
function buildClassificationRuleFromCollectionSequence(collectionSequenceObject, ruleToUpdate){
  var ruleToReturn = ruleToUpdate !== null && ruleToUpdate !== undefined ? ruleToUpdate : {};
  ruleToReturn.id = collectionSequenceObject.id;
  ruleToReturn.name = collectionSequenceObject.name;
  ruleToReturn.description = collectionSequenceObject.description;
  if(collectionSequenceObject.additional===undefined || collectionSequenceObject.additional===null){
    logger.error("Collection Sequence passed to build Classification Rule from has no 'additional' property. Collection Sequence: "+ JSON.stringify(collectionSequenceObject));
    throw "Unable to return Classification Rule.";
  }
  return ruleToReturn;
}

function buildClassificationRuleFromWorkflowEntry(workflowEntry, ruleToUpdate){
  var ruleToReturn = ruleToUpdate !== null && ruleToUpdate !== undefined ? ruleToUpdate : {};
  ruleToReturn.id = workflowEntry.collection_sequence_id;
  ruleToReturn.priority = workflowEntry.order;
  return ruleToReturn;
}

function buildRuleClassificationFromCollection(collection, ruleToUpdate){
  var ruleToReturn = ruleToUpdate !== null && ruleToUpdate !== undefined ? ruleToUpdate : {};
  ruleToReturn.id = collection.id;
  
  if(collection.additional===undefined || collection.additional===null){
    logger.warn("Collection passed to buildRuleClassificationFromCollection has no 'additional' property set. Cannot set Classification ID. Collection ID: "+collection.id);
    return ruleToReturn;
  }
  var policyIds = collection.additional.policy_ids;
  if(policyIds===undefined || policyIds===null || policyIds.length===0){
    logger.warn("Collection passed to buildRuleClassificationFromCollection has no 'additional.policy_ids' property set. Cannot set Classification ID. Collection ID: "+collection.id);
    return ruleToReturn;
  }
  if(policyIds.length > 1){
    logger.warn("Collection passed to buildRuleClassificationFromCollection has more than one Policy ID set. Only expecting a single Policy per Collection representing a Classification linked to a Rule Classification. Collection was: " +JSON.stringify(collection));
  }
  ruleToReturn.classificationId = policyIds[0];  
  return ruleToReturn;
}

function buildRuleClassificationFromCollectionAndClassificationId(collection, ruleToUpdate, classificationId){
  var ruleToReturn = ruleToUpdate !== null && ruleToUpdate !== undefined ? ruleToUpdate : {};
  ruleToReturn.classificationId = classificationId;
  ruleToReturn.id = collection.id;
  return ruleToReturn;
}

function buildTermListFromLexicon(lexicon, termList){
  var termListToReturn = termList !== null && termList !== undefined ? termList : {};
  termListToReturn.description = lexicon.description;
  termListToReturn.id = lexicon.id;
  termListToReturn.name = lexicon.name;
  return termListToReturn;
}

function buildTermFromLexiconExpression(expression, term){
  var termToReturn = term !== null && term !== undefined ? term : {};
  termToReturn.id = expression.id;
  termToReturn.expression = expression.additional.expression;
  termToReturn.type = expression.additional.type;
  return termToReturn;
}

function buildWorkflowFromPolicyWorkflow(polWorkflow, cWorkflow){
  var workflowToReturn = cWorkflow !== null && cWorkflow !== undefined ? cWorkflow : {};
  workflowToReturn.description = polWorkflow.description;
  workflowToReturn.id = polWorkflow.id;
  workflowToReturn.notes = polWorkflow.additional.notes;
  workflowToReturn.name = polWorkflow.name;
  return workflowToReturn;
}

////////////////////
/// CONDITIONS
////////////////////
//expects to be passed in the Classification Rule Root Condition as returned by Policy API and returns the Conditions set as children of this Root in the form of Classification API Conditions.
function buildRuleConditionsFromRootRulePolicyCondition(policyCondition){
  var isValid = policyApiObjectsHelper.checkConditionHasChildrenProperty(policyCondition);
  if(!isValid){
    throw "Unable to construct Conditions for Classification Rule.";
  }
  var ruleConditions = [];
  if(policyCondition.additional.children===null){
    logger.debug("Policy condition passed to construct Classification Rule conditions from has children set to 'null'. May not have been retrieved using 'include_children=true'. Classification Rule Condition ID: "+policyCondition.id);
    return ruleConditions;
  }
  //don't expose the root level Rule condition in Classification API. It is an internal concept.  
  for(var childCondition of policyCondition.additional.children){
    ruleConditions.push(buildConditionFromPolicyCondition(childCondition));
  }
  return ruleConditions;  
}

function buildConditionFromPolicyCondition(policyCondition, condition){
  var conditionToReturn = condition !== null && condition !== undefined ? condition : {};
  conditionToReturn.id = policyCondition.id;
  conditionToReturn.name = policyCondition.name;
  conditionToReturn.additional = {};
  conditionToReturn.additional.order = policyCondition.additional.order;
  conditionToReturn.additional.notes = policyCondition.additional.notes;
  conditionToReturn.additional.type = policyCondition.additional.type;
  
  //for some types we can reduce the properties returned to those relevant to this API.
  switch(policyCondition.additional.type){
    case 'boolean':
      buildBooleanAdditionalFromPolicyBooleanAdditional(policyCondition.additional, conditionToReturn.additional);
      break;
    case 'regex':
      buildRegexAdditionalFromPolicyRegexAddtional(policyCondition.additional, conditionToReturn.additional);
      break;
    case 'date':
      buildGenericComparisonConditionFromPolicyAdditional(policyCondition.additional, conditionToReturn.additional, 'date');
      break;
    case 'number':
      buildGenericComparisonConditionFromPolicyAdditional(policyCondition.additional, conditionToReturn.additional, 'number');
      break;
    case 'string':
      buildGenericComparisonConditionFromPolicyAdditional(policyCondition.additional, conditionToReturn.additional, 'string');
      break;
    case 'exists':
      buildExistsAdditionalFromPolicyExistsAdditional(policyCondition.additional, conditionToReturn.additional);
      break;
    case 'lexicon':
      buildTermListConditionFromPolicyLexiconAdditional(policyCondition.additional, conditionToReturn.additional);
      break;
    case 'fragment':    
      //TODO need to determine appropriate representation for lexicon in Classification API
    case 'not':
    case 'text':
      //TODO these types aren't yet defined in the model in a simplified form so returning them in complete form for now
      conditionToReturn.additional = policyCondition.additional;
      break;
    default:
      logger.error("Did not recognize type of condition on Policy API Condition when converting to Classification API Condition. Condition was: "+JSON.stringify(policyCondition));
      throw "Unrecognised Condition type returned.";
  }
  
  return conditionToReturn;  
}

function buildExistsAdditionalFromPolicyExistsAdditional(policyApi, classificationCondition){
  classificationCondition.type = 'exists';
  classificationCondition.field = policyApi.field;
}

//can be used across Condition types that record a value, operator and field.
function buildGenericComparisonConditionFromPolicyAdditional(policyApi, classificationCondition, conditionType){
  classificationCondition.type = conditionType;
  classificationCondition.value = policyApi.value;
  classificationCondition.operator = policyApi.operator;
  classificationCondition.field = policyApi.field;
  return classificationCondition;
}

function buildBooleanAdditionalFromPolicyBooleanAdditional(policyApi, classificationCondition){
  classificationCondition.type = 'boolean';
  classificationCondition.operator = policyApi.operator;
  classificationCondition.children = [];
  if(policyApi.children === null || policyApi.children.length ===0){
    return;
  }  
  for(var policyApiChildCondition of policyApi.children){
    //add the child conditions to the Classification API representation
    classificationCondition.children.push(buildConditionFromPolicyCondition(policyApiChildCondition));
  }
  return classificationCondition;
}

function buildRegexAdditionalFromPolicyRegexAddtional(policyApi, classificationCondition){
  classificationCondition.type = 'regex';
  classificationCondition.value = policyApi.value;
  classificationCondition.field = policyApi.field;
  return classificationCondition;
}

function buildTermListConditionFromPolicyLexiconAdditional(policyApi, classificationCondition){
  //we change the type 'lexicon' to 'termlist' as that is the terminology used in the Classification API.
  classificationCondition.type = 'termlist';
  classificationCondition.value = policyApi.value;
  classificationCondition.field = policyApi.field;
}

//Takes a policy condition and examines the properties to determine the classificationTarget value represented, returning this classificationTarget value.
function convertPolicyPropertiesToClassificationTarget(condition){
  var includeDescendantsValue = condition.additional.include_descendants;
  var targetValue = condition.additional.target.toUpperCase();
  
  if(includeDescendantsValue===true){
    if(targetValue==="ALL"){
      return "ALL";
    }
    else if(targetValue==="CHILDREN"){
      return "CHILDREN";
    }
    else if(targetValue==="CONTAINER"){
      return "CONTAINER";
    }
    else {
      logger.error("Did not recognize target value set on Policy API Condition when converting to Classification API Classification. Condition was: "+JSON.stringify(condition));
      throw "Error trying to determine Condition classificationTarget set.";
    }
  }
  
  if(targetValue==="ALL"){
    return "CONTAINER_AND_IMMEDIATE_CHILDREN";
  }
  else if(targetValue==="CHILDREN"){
    return "IMMEDIATE_CHILDREN";
  }
  else if(targetValue==="CONTAINER"){
    return "CONTAINER";
  }
  logger.error("Did not recognize target value set on Policy API Condition when converting to Classification API Classification. Condition was: "+JSON.stringify(condition));
  throw "Error trying to determine Condition classificationTarget set.";    
}