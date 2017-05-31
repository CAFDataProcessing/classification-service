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
//holds logic to take objects in Classification API form and pull property values from them to construct Policy API representations

module.exports = {  
  buildLexiconExpressionsFromTerms: buildLexiconExpressionsFromTerms,
  getDefaultPolicyAdditionalDefinition: getDefaultPolicyAdditionalDefinition,
  
  updateClassificationConditionAdditionalToPolicyForm: updateClassificationConditionAdditionalToPolicyForm
};

//This method updates condition passed to Classification API to be usable by Policy API. 
//Classification API allows omission of '"type":"condition"' by caller when working with conditions. Add this property to condition (and any children) from caller so that Policy API can understand it. Updates the object passed in.
//Classification API also allows usage of 'type' set to 'termlist' as that is how Lexicons are described by the Classification API, here we change that to 'lexicon' so Policy API can understand it (caller is free to pass type as 'lexicon' instead)
function updateClassificationConditionAdditionalToPolicyForm(condition){
  if(condition===undefined || condition === null){
    logger.debug(function(){return "'condition' passed to 'updateClassificationConditionAdditionalToPolicyForm' was null or undefined."});
    throw new Error("Invalid Condition encountered.");
  }
  
  if(!condition.hasOwnProperty('type')){
    condition.type = 'condition';
  }
  if(!condition.hasOwnProperty('additional')){
    throw new Error("Condition and any children it has must have 'additional' property defined.");
  }
  
  //change type from 'termlist' to 'lexicon' if required
  if(condition.additional.type==='termlist'){
    condition.additional.type = 'lexicon';
  }
  
  //update any child conditions with the type property
  if(condition.additional.hasOwnProperty('children') && condition.additional.children.length > 0){
    for(var childCondition of condition.additional.children){
      updateClassificationConditionAdditionalToPolicyForm(childCondition);
    }
  }
  //not condition specifies a condition on it, update with type as appropriate
  if(condition.additional.type==='not'){
    if(condition.additional.hasOwnProperty('condition')){
      updateClassificationConditionAdditionalToPolicyForm(condition.additional.condition);
    }
  }
}

//takes array of terms in Classification API form and converts to an array of Policy Lexicon Expressions
function buildLexiconExpressionsFromTerms(terms, termListId){
  var lexiconExpressions = [];
  if(terms.length===0){
    return lexiconExpressions;
  }
  for(var term of terms){
    lexiconExpressions.push(buildLexiconExpressionFromTerm(term, termListId));
  }
  return lexiconExpressions;
}

function buildLexiconExpressionFromTerm(term, termListId){
  var lexiconExpression = {
    type: "lexicon_expression",
    additional: {
      expression: term.expression,
      lexicon_id: termListId,
      type: term.type
    }
  };
  lexiconExpression.id = term.id;
  return lexiconExpression;
}

//returns a default 'additional' property for a Policy object. The value returned can be used to create a Policy with settings for a Metadata Policy Type (which is present in database by default).
function getDefaultPolicyAdditionalDefinition(){
  return {
    "priority": 0,
    "policy_type_id": 1,
    "details": {
      "fieldActions":[{
        "name":"Travel Documents","action":"ADD_FIELD_VALUE","value":"1"
      }]
    }
  };
}

