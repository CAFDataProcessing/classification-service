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
//holds validation methods that may be used by multiple other Classification API level models
var Q = require('q');
var logger = require('../logging/logging.js');
//MODELS
var colSeqModel = require('./policy_api/collectionSequence.js');
var workflowModel = require('./policy_api/workflow.js');
//HELPERS
var policyApiToClassification = require('../helpers/policyApiToClassificationApiHelper.js');
var ruleObjectsHelper = require('../helpers/classificationObjectsHelper.js').rules;
//ERRORS
var apiErrorFactory = require('./errors/apiErrorFactory.js');

module.exports = {
  validateWorkflowAndSeqForRule: validateWorkflowAndSeqForRule
};
var defaultNoMatchMessage = "Could not retrieve Classification Rule with ID: ";

//Searches for a specified Col Seq on a specified Workflow and returns the Col Seq, Workflow and Classification Rule representation
function validateWorkflowAndSeqForRule(getParams){
  var deferredGet = Q.defer();  
  var retrievedClassificationRule;
  var associatedWorkflow;
  var rulePriority;
  
  workflowModel.validateWorkflowExists(getParams.project_id, getParams.workflowId)
  .then(function(retrievedWorkflow){
    logger.debug(function(){return "Retrieved Workflow with ID: "+getParams.workflowId+" when retrieving Classification Rule ID: "+getParams.id;});
    associatedWorkflow = retrievedWorkflow;
    
    //get priority from the Workflow result (sequence_entries should be on the Workflow)
    var rulesMap = ruleObjectsHelper.getRulePrioritiesFromPolicyWorkflow(retrievedWorkflow);
    rulePriority = rulesMap[getParams.id];
    if(rulePriority===undefined){      
      throw apiErrorFactory.createNotFoundError("Classification Rule ID: "+ getParams.id + " not found on Workflow with ID: "+getParams.workflowId);
    }    
    
    return colSeqModel.validateSequenceExists(getParams.project_id, getParams.id, false, defaultNoMatchMessage + getParams.id);
  })
  .then(function(retrievedColSeq){    
    retrievedClassificationRule = policyApiToClassification.buildClassificationRuleFromCollectionSequenceAndOrder(retrievedColSeq, rulePriority);
    deferredGet.resolve({
      classificationRule: retrievedClassificationRule,
      collectionSequence: retrievedColSeq,
      workflow: associatedWorkflow
    });
  })
  .fail(function(errorResponse){
    deferredGet.reject(errorResponse);
  }).done();
  
  return deferredGet.promise;
}