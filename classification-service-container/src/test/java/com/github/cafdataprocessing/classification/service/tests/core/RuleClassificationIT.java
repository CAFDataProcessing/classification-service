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
import com.github.cafdataprocessing.classification.service.tests.utils.ApiClientProvider;
import com.github.cafdataprocessing.classification.service.tests.utils.ObjectsCreator;
import com.github.cafdataprocessing.classification.service.tests.utils.ObjectsInitializer;
import com.github.cafdataprocessing.classification.service.client.ApiClient;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.*;
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
 * Integration tests for Rule Classification API paths in the Classification Service.
 */
public class RuleClassificationIT {
    private static ObjectMapper mapper = new ObjectMapper();

    private static RuleClassificationsApi ruleClassificationsApi;
    private static ClassificationRulesApi classificationRulesApi;
    private static ClassificationsApi classificationsApi;
    private static WorkflowsApi workflowsApi;
    private String projectId;

    @BeforeClass
    public static void setup() throws Exception {
        ApiClient apiClient = ApiClientProvider.getApiClient();
        workflowsApi = new WorkflowsApi(apiClient);
        classificationRulesApi = new ClassificationRulesApi(apiClient);
        classificationsApi = new ClassificationsApi(apiClient);
        ruleClassificationsApi = new RuleClassificationsApi(apiClient);

        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Before every test generate a new project ID to avoid results from previous tests affecting subsequent tests.
     */
    @BeforeMethod
    public void intializeProjectId(){
        projectId = UUID.randomUUID().toString();
    }

    @Test(description="Creates, retrieves and updates some rule classifications.")
    public void createGetAndUpdateRuleClassification() throws ApiException {
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();

        //create a classification to use on rule classification
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_1.setAdditional(existsConditionAdditional);
        ExistingClassification createdClassification_1 = classificationsApi.createClassification(projectId,
                classification_1);
        long createdClassificationId = createdClassification_1.getId();

        ExistingRuleClassification createdRuleClassification_1 = createAndRetrieveRuleClassification(workflowId,
                classificationRuleId, createdClassificationId);

        //create another rule classification using a different classification
        BaseClassification classification_2 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional_2 = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_2.setAdditional(existsConditionAdditional_2);
        ExistingClassification createdClassification_2 = classificationsApi.createClassification(projectId,
                classification_2);
        long createdClassificationId_2 = createdClassification_2.getId();
        ExistingRuleClassification createdRuleClassification_2 = createAndRetrieveRuleClassification(workflowId,
                classificationRuleId, createdClassificationId_2);

        //update the first rule classification to point to a new classification
        BaseClassification classification_3 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional_3 = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_3.setAdditional(existsConditionAdditional_3);
        ExistingClassification createdClassification_3 = classificationsApi.createClassification(projectId,
                classification_3);
        long createdClassificationId_3 = createdClassification_3.getId();
        BaseRuleClassification updatedRuleClassification = ObjectsInitializer.initializeRuleClassification(createdClassificationId_3);
        ruleClassificationsApi.updateRuleClassification(projectId, workflowId, classificationRuleId,
                createdRuleClassification_1.getId(), updatedRuleClassification);

        //retrieve the rule classification and verify it is updated
        ExistingRuleClassification retrievedRuleClassification = ruleClassificationsApi.getRuleClassification(projectId,
                workflowId, classificationRuleId, createdRuleClassification_1.getId());
        compareRuleClassifications(updatedRuleClassification, retrievedRuleClassification);

        //verify that the first classification still exists despite not being used by the rule classification anymore
        //(lack of exception indicates it still exists)
        ExistingClassification unusedClassification = classificationsApi.getClassification(projectId, createdClassificationId);

        //verify that trying to update a rule classification that doesn't exist fails
        try{
            ruleClassificationsApi.updateRuleClassification(projectId, workflowId, classificationRuleId,
                    ThreadLocalRandom.current().nextLong(), updatedRuleClassification);
            Assert.fail("Expected an exception to be thrown trying to update a rule classification that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("not found on Classification Rule"),
                    "Expected message to state rule classification could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates some rule classifications then deletes one of them.")
    public void deleteRuleClassification() throws ApiException {
        //create workflow, classification rule and classification for use on rule classification.
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId = createdClassificationRule.getId();
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_1.setAdditional(existsConditionAdditional);
        ExistingClassification createdClassification_1 = classificationsApi.createClassification(projectId,
                classification_1);
        long createdClassificationId = createdClassification_1.getId();

        ExistingRuleClassification createdRuleClassification_1 = createAndRetrieveRuleClassification(workflowId,
                classificationRuleId, createdClassificationId);

        ExistingRuleClassification createdRuleClassification_2 = createAndRetrieveRuleClassification(workflowId,
                classificationRuleId, createdClassificationId);

        //delete the first rule classification
        ruleClassificationsApi.deleteRuleClassification(projectId, workflowId, classificationRuleId,
                createdRuleClassification_1.getId());

        ExistingRuleClassifications retrievedRuleClassifications = ruleClassificationsApi.getRuleClassifications(
                projectId, workflowId, classificationRuleId, 1, 100
        );
        Assert.assertEquals((int)retrievedRuleClassifications.getTotalHits(), 1,
                "Total Hits should be one after deleting a rule classification.");
        Assert.assertEquals(retrievedRuleClassifications.getRuleClassifications().size(), 1,
                "One rule classification should be returned in the results.");

        ExistingRuleClassification remainingRuleClassification = retrievedRuleClassifications.getRuleClassifications().get(0);
        compareRuleClassifications(createdRuleClassification_2, remainingRuleClassification);

        Assert.assertEquals(remainingRuleClassification.getId(), createdRuleClassification_2.getId(),
                "ID of remaining rule classification should be the second rule classification that was created.");
        try{
            ruleClassificationsApi.getRuleClassification(projectId,
                    workflowId, classificationRuleId, createdRuleClassification_1.getId());
            Assert.fail("Expecting exception to be thrown when trying to retrieve deleted rule classification.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("not found"),
                    "Exception message should contain expected message about not finding rule classification.");
        }
    }

    @Test(description ="Creates some rule classifications and deletes them all.")
    public void deleteRuleClassifications() throws ApiException {
        //create workflow, classification rule and classification for use on rule classification.
        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule_1 = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId_1 = createdClassificationRule_1.getId();
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_1.setAdditional(existsConditionAdditional);
        ExistingClassification createdClassification_1 = classificationsApi.createClassification(projectId,
                classification_1);
        long createdClassificationId = createdClassification_1.getId();

        int numberOfRCsToCreate = 26;
        List<ExistingRuleClassification> createdRCs_1 = createMultipleRuleClassifications(numberOfRCsToCreate, workflowId,
                classificationRuleId_1, createdClassificationId);

        //create a second classification rule on the same workflow that has rule classifications.
        //this will be checked later to verify the delete only acted on a the specified classification rule.
        ExistingClassificationRule createdClassificationRule_2 = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId_2 = createdClassificationRule_2.getId();
        numberOfRCsToCreate = 17;
        List<ExistingRuleClassification> createdRCs_2 = createMultipleRuleClassifications(numberOfRCsToCreate, workflowId,
                classificationRuleId_2, createdClassificationId);

        //delete all the rule classifications on first classification rule
        ruleClassificationsApi.deleteRuleClassifications(projectId, workflowId, classificationRuleId_1);

        //verify that there are no rule classifications on first classification rule
        ExistingRuleClassifications rcsPage = ruleClassificationsApi.getRuleClassifications(projectId,
                workflowId, classificationRuleId_1, 1, 100);
        Assert.assertEquals((int)rcsPage.getTotalHits(), 0,
                "Total Hits should be zero after deleting all rule classifications.");
        Assert.assertTrue(rcsPage.getRuleClassifications().isEmpty(),
                "No rule classifications should be returned in the results.");

        //verify that the second classification rule was unaffected
        int pageSize = 100;
        pageThroughRuleClassifications(pageSize, workflowId, classificationRuleId_2, createdRCs_2, numberOfRCsToCreate);
    }

    @Test(description = "Creates rule classifications and retrieves them through paging.")
    public void getRuleClassifications() throws ApiException {
        int numberOfRCsToCreate = 26;

        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule_1 = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId_1 = createdClassificationRule_1.getId();

        ExistingClassification createdClassification_1 = createClassification();
        long createdClassificationId_1 = createdClassification_1.getId();

        List<ExistingRuleClassification> createdRCs = createMultipleRuleClassifications(numberOfRCsToCreate, workflowId, classificationRuleId_1, createdClassificationId_1);

        //page through the rule classifications
        int pageSize = 5;
        pageThroughRuleClassifications(pageSize, workflowId, classificationRuleId_1, createdRCs, numberOfRCsToCreate);

        //create another classification rule and verify that only the rule classifications under it are returned
        ExistingClassificationRule createdClassificationRule_2 = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId_2 = createdClassificationRule_2.getId();

        numberOfRCsToCreate = 23;
        createdRCs = createMultipleRuleClassifications(numberOfRCsToCreate, workflowId, classificationRuleId_2, createdClassificationId_1);
        pageSize = 3;
        pageThroughRuleClassifications(pageSize, workflowId, classificationRuleId_2, createdRCs, numberOfRCsToCreate);

        //create another workflow and verify that only the rule classifications under it are returned
        createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule_3 = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId_3 = createdClassificationRule_3.getId();

        numberOfRCsToCreate = 17;
        createdRCs = createMultipleRuleClassifications(numberOfRCsToCreate, workflowId, classificationRuleId_3, createdClassificationId_1);
        pageSize = 5;
        pageThroughRuleClassifications(pageSize, workflowId, classificationRuleId_3, createdRCs, numberOfRCsToCreate);
    }
    
    @Test(description = "Checks that updating a classification rule does not delete the child rule classifications on it.")
    public void updateClassificationRuleAndCheckRuleClassifications() throws ApiException {
        int numberOfRCsToCreate = 26;

        ExistingWorkflow createdWorkflow = ObjectsCreator.createWorkflow(projectId);
        long workflowId = createdWorkflow.getId();
        ExistingClassificationRule createdClassificationRule_1 = ObjectsCreator.createClassificationRule(projectId,
                workflowId, null);
        long classificationRuleId_1 = createdClassificationRule_1.getId();

        ExistingClassification createdClassification_1 = createClassification();
        long createdClassificationId_1 = createdClassification_1.getId();

        List<ExistingRuleClassification> createdRCs = createMultipleRuleClassifications(numberOfRCsToCreate, workflowId,
                classificationRuleId_1, createdClassificationId_1);

        //take a copy of this for use later
        List<ExistingRuleClassification> copyOfFirstRuleClassifications = new LinkedList<>();
        copyOfFirstRuleClassifications.addAll(createdRCs);

        //page through the rule classifications
        int pageSize = 5;
        pageThroughRuleClassifications(pageSize, workflowId, classificationRuleId_1, createdRCs, numberOfRCsToCreate);
        
        //update the classification rule and verify rule classifications are unchanged
        createdClassification_1.setDescription("Updated description.");
        classificationRulesApi.updateClassificationRule(projectId, workflowId, classificationRuleId_1,
                createdClassificationRule_1);

        pageThroughRuleClassifications(pageSize, workflowId, classificationRuleId_1, copyOfFirstRuleClassifications,
                numberOfRCsToCreate);
    }

    private List<ExistingRuleClassification> createMultipleRuleClassifications(int numberOfRCsToCreate, long workflowId,
                                                                                long classificationRuleId_1,
                                                                                long createdClassificationId_1) throws ApiException {
        List<ExistingRuleClassification> createdRCs = new LinkedList<>();
        for(int createdRCCounter = 0; createdRCCounter < numberOfRCsToCreate;
            createdRCCounter++) {
            BaseRuleClassification rcToCreate = ObjectsInitializer.initializeRuleClassification(createdClassificationId_1);
            createdRCs.add(ruleClassificationsApi.createRuleClassification(projectId, workflowId, classificationRuleId_1,
                    rcToCreate));
        }
        return createdRCs;
    }

    /**
     * Convenience method to create a classification with an exists condition on it for use in rule classifications.
     * @return The created classification.
     */
    private ExistingClassification createClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_1.setAdditional(existsConditionAdditional);
        return classificationsApi.createClassification(projectId,
                classification_1);
    }

    private void pageThroughRuleClassifications(int pageSize, long workflowId, long classificationRuleId,
                                                List<ExistingRuleClassification> rcsToFind,
                                                int expectedNumberOfRCs) throws ApiException{
        int pageNum = 1;
        int rcsSoFarCount = 0;
        while(true){
            ExistingRuleClassifications rcsPage = ruleClassificationsApi.getRuleClassifications(projectId,
                    workflowId, classificationRuleId, pageNum, pageSize);
            Assert.assertEquals((int)rcsPage.getTotalHits(),
                    expectedNumberOfRCs, "Total hits should be the same as the expected number of rule classification.");
            List<ExistingRuleClassification> retrievedRCs = rcsPage.getRuleClassifications();
            if(pageNum*pageSize <= expectedNumberOfRCs){
                //until we get to the page that includes the last result (or go beyond the number available) there should always be 'pageSize' number of results returned
                Assert.assertEquals(retrievedRCs.size(), pageSize, "Expecting full page of rule classification results.");
            }
            //remove returned rule classifications from list of rule classifications to find
            checkRuleClassificationsReturned(rcsPage, rcsToFind);
            //increment page num so that next call retrieves next page
            pageNum++;
            rcsSoFarCount += retrievedRCs.size();
            if(rcsSoFarCount > expectedNumberOfRCs){
                Assert.fail("More rule classifications encountered than expected.");
            }
            else if(rcsSoFarCount == expectedNumberOfRCs){
                Assert.assertTrue(rcsToFind.isEmpty(),
                        "After encountering the expected number of rule classifications there should be no more rule classifications that we are searching for.");
                break;
            }
        }
        //send a final get request and verify that nothing is returned.
        ExistingRuleClassifications expectedEmptyGetResult = ruleClassificationsApi.getRuleClassifications(projectId,
                workflowId, classificationRuleId, pageNum, pageSize);

        Assert.assertEquals((int) expectedEmptyGetResult.getTotalHits(), expectedNumberOfRCs,
                "Total hits should report the expected number of rule classifications even on a page outside range of results.");
        Assert.assertTrue(expectedEmptyGetResult.getRuleClassifications().isEmpty(),
                "Should be no rule classifications returned for page request outside expected range.");
    }


    private ExistingRuleClassification createAndRetrieveRuleClassification(long workflowId,
                                                                           long classificationRuleId,
                                                                           long classificationId) throws ApiException {
        BaseRuleClassification ruleClassificationToCreate_1 =
                ObjectsInitializer.initializeRuleClassification(classificationId);
        ExistingRuleClassification createdRuleClassification_1 = ruleClassificationsApi.createRuleClassification(
                projectId, workflowId, classificationRuleId, ruleClassificationToCreate_1);

        compareRuleClassifications(ruleClassificationToCreate_1, createdRuleClassification_1);
        ExistingRuleClassification retrievedRuleClassification = ruleClassificationsApi.getRuleClassification(projectId,
                workflowId, classificationRuleId, createdRuleClassification_1.getId());
        Assert.assertEquals(retrievedRuleClassification.getId(), createdRuleClassification_1.getId(),
                "ID of retrieved Rule Classification should be the same as the ID sent on request.");
        compareRuleClassifications(ruleClassificationToCreate_1, retrievedRuleClassification);
        return retrievedRuleClassification;
    }

    private void compareRuleClassifications(BaseRuleClassification expectedRuleClassification,
                                            ExistingRuleClassification retrievedRuleClassification){
        Assert.assertEquals(retrievedRuleClassification.getClassificationId(),
                expectedRuleClassification.getClassificationId(),
                "The Classification ID on the Rule Classifications should match.");
    }

    /**
     * Search the retrieved rule classifications passed for the occurrence of a set of rule classifications.
     * When a match is found for a rule classification it is removed from the list of rule classifications to find passed in.
     * @param retrievedRCs The rule classifications to search through.
     * @param rcsToFind The rule classifications to search for.
     */
    private void checkRuleClassificationsReturned(ExistingRuleClassifications retrievedRCs,
                                         List<ExistingRuleClassification> rcsToFind){
        for(ExistingRuleClassification retrievedRC: retrievedRCs.getRuleClassifications()){
            Optional<ExistingRuleClassification> foundRC = rcsToFind.stream()
                    .filter(filterRC -> filterRC.getId().equals(retrievedRC.getId())).findFirst();
            if(foundRC.isPresent()) {
                compareRuleClassifications(foundRC.get(), retrievedRC);
                //remove from the list of rule classifications for next check
                rcsToFind.remove(foundRC.get());
            }
            else{
                Assert.fail("An unexpected condition was returned.");
            }
        }
    }
}
