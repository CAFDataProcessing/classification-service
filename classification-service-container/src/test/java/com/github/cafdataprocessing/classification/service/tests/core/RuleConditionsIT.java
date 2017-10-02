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
package com.github.cafdataprocessing.classification.service.tests.core;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cafdataprocessing.classification.service.tests.utils.AdditionalPropertyComparison;
import com.github.cafdataprocessing.classification.service.tests.utils.ApiClientProvider;
import com.github.cafdataprocessing.classification.service.tests.utils.ObjectsCreator;
import com.github.cafdataprocessing.classification.service.tests.utils.ObjectsInitializer;
import com.github.cafdataprocessing.classification.service.client.ApiClient;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationRulesApi;
import com.github.cafdataprocessing.classification.service.client.api.RuleConditionsApi;
import com.github.cafdataprocessing.classification.service.client.api.TermsApi;
import com.github.cafdataprocessing.classification.service.client.api.WorkflowsApi;
import com.github.cafdataprocessing.classification.service.client.model.*;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Integration tests for Rule Condition API paths in the Classification Service.
 */
public class RuleConditionsIT {
    private static ObjectMapper mapper = new ObjectMapper();

    private static ClassificationRulesApi classificationRulesApi;
    private static TermsApi termsApi;
    private static WorkflowsApi workflowsApi;
    private static RuleConditionsApi ruleConditionsApi;
    private String projectId;

    @BeforeClass
    public static void setup() throws Exception {
        ApiClient apiClient = ApiClientProvider.getApiClient();
        workflowsApi = new WorkflowsApi(apiClient);
        classificationRulesApi = new ClassificationRulesApi(apiClient);
        ruleConditionsApi = new RuleConditionsApi(apiClient);
        termsApi = new TermsApi(apiClient);

        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Before every test generate a new project ID to avoid results from previous tests affecting subsequent tests.
     */
    @BeforeMethod
    public void intializeProjectId(){
        projectId = UUID.randomUUID().toString();
    }

    @Test(description = "Creates some rule conditions and retrieves them.")
    public void createAndGetRuleCondition() throws ApiException {
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();
        Condition condition_1 = ObjectsInitializer.initializeCondition(null);

        ExistingCondition createdCondition_1 = ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId, condition_1);
        compareConditions(condition_1, createdCondition_1);

        //create another rule condition under this workflow and classification rule
        Condition condition_2 = ObjectsInitializer.initializeCondition(null);
        BooleanConditionAdditional booleanConditionAdditional = ObjectsInitializer.initializeBooleanConditionAdditional(null);
        condition_2.setAdditional(booleanConditionAdditional);

        ExistingCondition createdCondition_2 = ruleConditionsApi.createClassificationRuleCondition(projectId,
                workflowId, classificationRuleId, condition_2);
        compareConditions(condition_2, createdCondition_2);

        //retrieve the conditions
        ExistingCondition retrievedCondition = ruleConditionsApi.getClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, createdCondition_1.getId());
        Assert.assertEquals(retrievedCondition.getId(), createdCondition_1.getId(), "ID of retrieved condition should match ID requested");
        compareConditions(createdCondition_1, retrievedCondition);

        retrievedCondition = ruleConditionsApi.getClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, createdCondition_2.getId());
        Assert.assertEquals(retrievedCondition.getId(), createdCondition_2.getId(), "ID of retrieved condition should match ID requested");
        compareConditions(createdCondition_2, retrievedCondition);
    }

    @Test(description = "Creates a rule condition of type Number with a 64-bit and retrieves it.")
    public void createAndGet64BitNumberRuleCondition() throws ApiException {
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();
        Condition condition_1 = ObjectsInitializer.initializeCondition(null);
        Long largeValue = 1234567890123456786L;
        NumberConditionAdditional numberConditionAdditional = ObjectsInitializer.initializeNumberConditionAdditional(largeValue);
        condition_1.setAdditional(numberConditionAdditional);

        ExistingCondition createdCondition_1 = ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId, condition_1);
        compareConditions(condition_1, createdCondition_1);

        //retrieve the conditions
        ExistingCondition retrievedCondition = ruleConditionsApi.getClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, createdCondition_1.getId());
        Assert.assertEquals(retrievedCondition.getId(), createdCondition_1.getId(), "ID of retrieved condition should match ID requested");
        compareConditions(createdCondition_1, retrievedCondition);
    }

    @Test(description = "Creates a rule condition and then updates it.")
    public void updateRuleCondition() throws ApiException {
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();
        Condition condition_1 = ObjectsInitializer.initializeCondition(null);

        ExistingCondition createdCondition_1 = ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId, condition_1);
        compareConditions(condition_1, createdCondition_1);

        ExistingCondition retrievedCondition = ruleConditionsApi.getClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, createdCondition_1.getId());
        Assert.assertEquals(retrievedCondition.getId(), createdCondition_1.getId(), "ID of retrieved condition should match ID requested");
        compareConditions(createdCondition_1, retrievedCondition);

        //update the condition
        Condition updatedCondition = ObjectsInitializer.initializeCondition(null);
        BooleanConditionAdditional booleanConditionAdditional = ObjectsInitializer.initializeBooleanConditionAdditional(null);
        updatedCondition.setAdditional(booleanConditionAdditional);

        ruleConditionsApi.updateClassificationRuleCondition(projectId, workflowId, classificationRuleId, createdCondition_1.getId(),
                updatedCondition);

        ExistingCondition retrievedUpdatedCondition = ruleConditionsApi.getClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, createdCondition_1.getId());
        Assert.assertEquals(retrievedUpdatedCondition.getId(), retrievedUpdatedCondition.getId(), "ID of updated retrieved condition should match ID requested");
        compareConditions(updatedCondition, retrievedUpdatedCondition);

        //verify that trying to update a rule condition that doesn't exist fails
        try{
            ruleConditionsApi.updateClassificationRuleCondition(projectId, workflowId, classificationRuleId,
                    ThreadLocalRandom.current().nextLong(), updatedCondition);
            Assert.fail("Expected an exception to be thrown trying to update a rule condition that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find matching Condition with ID"),
                    "Expected message to state rule condition could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates rule condition with a term list condition and retrieves it.")
    public void createAndGetTermListRuleCondition() throws ApiException{
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();

        Condition conditionToCreate = ObjectsInitializer.initializeCondition(null);

        //create a term list to reference on the classification
        BaseTermList termListToCreate  = ObjectsInitializer.initializeTermList();
        ExistingTermList termListCreated = termsApi.createTermList(projectId, termListToCreate);
        Long termListCreatedId = termListCreated.getId();

        TermlistConditionAdditional termlistConditionAdditional = ObjectsInitializer.initializeTermListConditionAdditional(termListCreatedId.toString());
        conditionToCreate.setAdditional(termlistConditionAdditional);
        ExistingCondition createdCondition_1 = ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, conditionToCreate);
        compareConditions(conditionToCreate, createdCondition_1);

        ExistingCondition retrievedCondition = ruleConditionsApi.getClassificationRuleCondition(projectId, workflowId,
                classificationRuleId, createdCondition_1.getId());
        Assert.assertEquals(retrievedCondition.getId(), createdCondition_1.getId(), "ID of retrieved condition should match ID requested");
        compareConditions(createdCondition_1, retrievedCondition);
    }

    @Test(description = "Creates some rule conditions and retrieves them through paging.")
    public void getRuleConditions() throws ApiException {
        int numberOfConditionsToCreate = 26;
        List<ExistingCondition> createdConditions = new LinkedList<>();

        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();

        for(int createdConditionCounter = 0; createdConditionCounter < numberOfConditionsToCreate;
            createdConditionCounter++) {
            Condition conditionToCreate = ObjectsInitializer.initializeCondition(null);
            createdConditions.add(ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId,
                    conditionToCreate));
        }

        //page through the conditions
        int pageSize = 5;
        pageThroughConditions(pageSize, workflowId, classificationRuleId, createdConditions, numberOfConditionsToCreate);

        //create another classification rule and verify that conditions created under it are correctly pageable
        numberOfConditionsToCreate = 23;
        createdConditions = new LinkedList<>();
        createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        classificationRuleId = createdClassificationRule.getId();

        for(int createdConditionCounter = 0; createdConditionCounter < numberOfConditionsToCreate;
            createdConditionCounter++) {
            Condition conditionToCreate = ObjectsInitializer.initializeCondition(null);
            createdConditions.add(ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId,
                    conditionToCreate));
        }
        pageSize = 4;
        pageThroughConditions(pageSize, workflowId, classificationRuleId, createdConditions, numberOfConditionsToCreate);

        //create another workflow, add conditions under it, then verify only those conditions appropriate are returned
        createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        workflowId = createdWorkflow.getId();
        numberOfConditionsToCreate = 25;
        createdConditions = new LinkedList<>();
        createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        classificationRuleId = createdClassificationRule.getId();

        for(int createdConditionCounter = 0; createdConditionCounter < numberOfConditionsToCreate;
            createdConditionCounter++) {
            Condition conditionToCreate = ObjectsInitializer.initializeCondition(null);
            createdConditions.add(ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId,
                    conditionToCreate));
        }
        pageSize = 100;
        pageThroughConditions(pageSize, workflowId, classificationRuleId, createdConditions, numberOfConditionsToCreate);
    }

    @Test(description = "Creates some rule conditions then deletes one of them.")
    public void deleteRuleCondition() throws ApiException {
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();

        Condition conditionToCreate_1 = ObjectsInitializer.initializeCondition(null);
        ExistingCondition createdCondition_1 = ruleConditionsApi.createClassificationRuleCondition(projectId,
                workflowId, classificationRuleId, conditionToCreate_1);

        Condition conditionToCreate_2 = ObjectsInitializer.initializeCondition(null);
        ExistingCondition createdCondition_2 = ruleConditionsApi.createClassificationRuleCondition(projectId,
                workflowId, classificationRuleId, conditionToCreate_2);

        //delete first condition
        ruleConditionsApi.deleteClassificationRuleCondition(projectId, workflowId, classificationRuleId, createdCondition_1.getId());

        ExistingConditions conditionsPage = ruleConditionsApi.getClassificationRuleConditions(projectId,
                workflowId, classificationRuleId, 1, 100);
        Assert.assertEquals((int)conditionsPage.getTotalHits(), 1,
                "Total Hits should be one after deleting a condition.");
        Assert.assertEquals(conditionsPage.getConditions().size(), 1,
                "One condition should be returned in the results.");

        ExistingCondition remainingCondition = conditionsPage.getConditions().get(0);
        compareConditions(createdCondition_2, remainingCondition);

        Assert.assertEquals(remainingCondition.getId(), createdCondition_2.getId(),
                "ID of remaining condition should be the second condition that was created.");
        try{
            ruleConditionsApi.getClassificationRuleCondition(projectId,
                    workflowId, classificationRuleId, createdCondition_1.getId());
            Assert.fail("Expecting exception to be thrown when trying to retrieve deleted condition.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find matching Condition"),
                    "Exception message should contain expected message about not finding conditon.");
        }
    }

    /**
     * Compares a retrieved condition against an expected version of it.
     * @param expectedCondition The condition expected.
     * @param retrievedCondition The condition that was returned.
     */
    private static void compareConditions(Condition expectedCondition, ExistingCondition retrievedCondition){
        Assert.assertEquals(retrievedCondition.getName(), expectedCondition.getName(), "Name on rule condition should be as expected.");
        ConditionCommon createdAdditional = mapper.convertValue(retrievedCondition.getAdditional(), ConditionCommon.class);
        ConditionCommon expectedAdditional = mapper.convertValue(expectedCondition.getAdditional(), ConditionCommon.class);
        AdditionalPropertyComparison.compareAdditional(expectedAdditional.getType(), createdAdditional.getType(),
                expectedCondition.getAdditional(), retrievedCondition.getAdditional());
    }

    private void pageThroughConditions(int pageSize, long workflowId, long classificationRuleId,
                                       List<ExistingCondition> conditionsToFind, int expectedNumberOfConditions) throws ApiException {
        int pageNum = 1;
        int conditionsSoFarCount = 0;
        while(true){
            ExistingConditions conditionsPage = ruleConditionsApi.getClassificationRuleConditions(projectId,
                    workflowId, classificationRuleId, pageNum, pageSize);
            Assert.assertEquals((int)conditionsPage.getTotalHits(),
                    expectedNumberOfConditions, "Total hits should be the same as the expected number of conditions.");
            List<ExistingCondition> retrievedConditions = conditionsPage.getConditions();

            if(pageNum*pageSize <= expectedNumberOfConditions){
                //until we get to the page that includes the last result (or go beyond the number available) there should always be 'pageSize' number of results returned
                Assert.assertEquals(retrievedConditions.size(), pageSize, "Expecting full page of condition results.");
            }
            //remove returned classification rules from list of classification rules to find
            checkConditionsReturned(conditionsPage, conditionsToFind);
            //increment page num so that next call retrieves next page
            pageNum++;
            conditionsSoFarCount += retrievedConditions.size();
            if(conditionsSoFarCount > expectedNumberOfConditions){
                Assert.fail("More conditions encountered than expected.");
            }
            else if(conditionsSoFarCount == expectedNumberOfConditions){
                Assert.assertTrue(conditionsToFind.isEmpty(),
                        "After encountering the expected number of conditions there should be no more conditions that we are searching for.");
                break;
            }
        }
        //send a final get request and verify that nothing is returned.
        ExistingConditions expectedEmptyGetResult = ruleConditionsApi.getClassificationRuleConditions(projectId,
                workflowId, classificationRuleId, pageNum, pageSize);

        Assert.assertEquals((int) expectedEmptyGetResult.getTotalHits(), expectedNumberOfConditions,
                "Total hits should report the expected number of conditions even on a page outside range of results.");
        Assert.assertTrue(expectedEmptyGetResult.getConditions().isEmpty(),
                "Should be no conditions returned for page request outside expected range.");

    }

    /**
     * Search the retrieved conditions passed for the occurrence of a set of conditions.
     * When a match is found for a condition it is removed from the list of conditions to find passed in.
     * @param retrievedConditions The conditions to search through.
     * @param conditionsToFind The conditions to search for.
     */
    private void checkConditionsReturned(ExistingConditions retrievedConditions,
                                         List<ExistingCondition> conditionsToFind){
        for(ExistingCondition retrievedCondition: retrievedConditions.getConditions()){
            Optional<ExistingCondition> foundCondition = conditionsToFind.stream()
                    .filter(filterCondition -> filterCondition.getId().equals(retrievedCondition.getId())).findFirst();
            if(foundCondition.isPresent()) {
                compareConditions(foundCondition.get(), retrievedCondition);
                //remove from the list of conditions for next check
                conditionsToFind.remove(foundCondition.get());
            }
            else{
                Assert.fail("An unexpected condition was returned.");
            }
        }
    }

}
