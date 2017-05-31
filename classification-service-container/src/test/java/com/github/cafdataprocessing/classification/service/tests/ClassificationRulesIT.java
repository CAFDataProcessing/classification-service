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
package com.github.cafdataprocessing.classification.service.tests;

import com.github.cafdataprocessing.classification.service.tests.utils.ApiClientProvider;
import com.github.cafdataprocessing.classification.service.tests.utils.ObjectsInitializer;
import com.github.cafdataprocessing.classification.service.client.ApiClient;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationRulesApi;
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
 * Integration tests for Classification Rule API paths in the Classification Service.
 */
public class ClassificationRulesIT {
    private static ClassificationRulesApi classificationRulesApi;
    private static WorkflowsApi workflowsApi;
    private String projectId;

    @BeforeClass
    public static void setup() throws Exception {
        ApiClient apiClient = ApiClientProvider.getApiClient();
        workflowsApi = new WorkflowsApi(apiClient);
        classificationRulesApi = new ClassificationRulesApi(apiClient);
    }

    /**
     * Before every test generate a new project ID to avoid results from previous tests affecting subsequent tests.
     */
    @BeforeMethod
    public void intializeProjectId(){
        projectId = UUID.randomUUID().toString();
    }

    @Test(description = "Creates some classification rules.")
    public void createClassificationRule() throws ApiException {
        Integer classificationRulePriority_1 = 1;
        BaseClassificationRule classificationRule_1 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_1);

        ExistingWorkflow workflow = createWorkflow();
        ExistingClassificationRule createdRule_1 = classificationRulesApi.createClassificationRule(projectId, workflow.getId(), classificationRule_1);
        compareClassificationRules(classificationRule_1, createdRule_1);

        Integer classificationRulePriority_2 = 2;
        BaseClassificationRule classificationRule_2 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_2);
        ExistingClassificationRule createdRule_2 = classificationRulesApi.createClassificationRule(projectId, workflow.getId(), classificationRule_2);
        compareClassificationRules(classificationRule_2, createdRule_2);

        //test that omitting Priority causes it to automatically be set to one more than current highest priority on the workflow
        BaseClassificationRule classificationRule_3 = ObjectsInitializer.initializeClassificationRule(null);
        ExistingClassificationRule createdRule_3 = classificationRulesApi.createClassificationRule(projectId, workflow.getId(), classificationRule_3);
        compareClassificationRules(classificationRule_3, createdRule_3, classificationRulePriority_2+1);

        //create rule under a different workflow and verify a null priority results in priority of 1 being set
        workflow = createWorkflow();
        BaseClassificationRule classificationRule_4 = ObjectsInitializer.initializeClassificationRule(null);
        ExistingClassificationRule createdRule_4 = classificationRulesApi.createClassificationRule(projectId, workflow.getId(), classificationRule_4);
        compareClassificationRules(classificationRule_4, createdRule_4, 1);

        //test that specifying same priority as an existing classification rule causes the created classification rule to return the priority it specified
        BaseClassificationRule classificationRule_5 = ObjectsInitializer.initializeClassificationRule(1);
        ExistingClassificationRule createdRule_5 = classificationRulesApi.createClassificationRule(projectId, workflow.getId(), classificationRule_5);
        compareClassificationRules(classificationRule_5, createdRule_5, 1);
    }

    @Test(description = "Creates some classification rules and then retrieves them individually.")
    public void getClassificationRule() throws ApiException {
        Integer classificationRulePriority_1 = 1;
        BaseClassificationRule classificationRule_1 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_1);

        ExistingWorkflow workflow_1 = createWorkflow();
        Long workflowId_1 = workflow_1.getId();
        ExistingClassificationRule createdRule_1 = classificationRulesApi.createClassificationRule(projectId, workflowId_1, classificationRule_1);

        //Specify no priority for second rule to ensure that it is defaulted to next available priority.
        BaseClassificationRule classificationRule_2 = ObjectsInitializer.initializeClassificationRule(null);
        ExistingClassificationRule createdRule_2 = classificationRulesApi.createClassificationRule(projectId, workflowId_1, classificationRule_2);

        //retrieve the classification rules
        ExistingClassificationRule retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_1, createdRule_1.getId());
        Assert.assertEquals(retrievedClassificationRule.getId(), createdRule_1.getId(), "ID of Classification Rule returned does not match ID requested. 1st Rule.");
        compareClassificationRules(createdRule_1, retrievedClassificationRule);

        retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_1, createdRule_2.getId());
        Assert.assertEquals(retrievedClassificationRule.getId(), createdRule_2.getId(), "ID of Classification Rule returned does not match ID requested. 2nd Rule.");
        compareClassificationRules(createdRule_2, retrievedClassificationRule, 2);


        //verify that adding a classification rule with an existing priority causes existing classification rule priorities
        //to be incremented
        {
            BaseClassificationRule classificationRule_3 = ObjectsInitializer.initializeClassificationRule(1);
            ExistingClassificationRule createdRule_3 = classificationRulesApi.createClassificationRule(projectId,
                    workflowId_1, classificationRule_3);

            //retrieve the existing classification rules and verify their priorities are as expected
            retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_1,
                    createdRule_3.getId());
            compareClassificationRules(classificationRule_3, retrievedClassificationRule, 1);

            retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_1,
                    createdRule_1.getId());
            compareClassificationRules(classificationRule_1, retrievedClassificationRule, 2);

            retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_1,
                    createdRule_2.getId());
            compareClassificationRules(classificationRule_2, retrievedClassificationRule, 3);

        }
        //create another workflow and store a new classification rule on it
        {
            ExistingWorkflow workflow_2 = createWorkflow();

            Long workflowId_2 = workflow_2.getId();
            BaseClassificationRule classificationRule_3 = ObjectsInitializer.initializeClassificationRule(null);
            ExistingClassificationRule createdRule_3 = classificationRulesApi.createClassificationRule(projectId, workflowId_2, classificationRule_3);

            //verify that rule can be retrieved from correct workflow
            retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_2, createdRule_3.getId());
            compareClassificationRules(createdRule_3, retrievedClassificationRule, 1);

            //verify that trying to retrieve classification rule from non-parent workflow results in error
            try {
                retrievedClassificationRule = classificationRulesApi.getClassificationRule(projectId, workflowId_1, createdRule_3.getId());
                Assert.fail("Exception was not thrown when requesting classification rule with non parent workflow ID.");
            } catch (ApiException e) {
                Assert.assertTrue(e.getMessage().contains("not found on Workflow with ID"), "Response on exception should describe that classification rule could not be found on the Workflow.");
            }
        }
    }

    @Test(description = "Creates some classification rules then retrieves them as pages.")
    public void getClassificationRules() throws ApiException {
        //creates rules under different workflows to verify there is no crossover in the results.
        int numberOfRulesToCreate_1 = 21;
        int numberOfRulesToCreate_2 = 28;

        ExistingWorkflow workflow_1 = createWorkflow();
        ExistingWorkflow workflow_2 = createWorkflow();

        List<ExistingClassificationRule> createdClassificationRules_1 = createMultipleClassificationRules(numberOfRulesToCreate_1, workflow_1.getId());
        List<ExistingClassificationRule> createdClassificationRules_2 = createMultipleClassificationRules(numberOfRulesToCreate_2, workflow_2.getId());

        //page through classification rules on first workflow. Should find all that were created.
        int pageSize = 5;
        pageThroughClassificationRules(pageSize, workflow_1.getId(), createdClassificationRules_1, createdClassificationRules_1.size());
        //changing page size to verify the parameter is respected
        pageSize = 4;
        pageThroughClassificationRules(pageSize, workflow_2.getId(), createdClassificationRules_2, createdClassificationRules_2.size());
    }

    @Test(description = "Creates a classification rule then updates it.")
    public void updateClassificationRule() throws ApiException {
        Integer classificationRulePriority_1 = 1;
        BaseClassificationRule classificationRule_1 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_1);

        ExistingWorkflow workflow_1 = createWorkflow();
        Long workflowId_1 = workflow_1.getId();
        ExistingClassificationRule createdRule_1 = classificationRulesApi.createClassificationRule(projectId, workflowId_1, classificationRule_1);

        Integer classificationRulePriority_2 = 2;
        BaseClassificationRule classificationRule_2 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_2);
        ExistingClassificationRule createdRule_2 = classificationRulesApi.createClassificationRule(projectId, workflowId_1, classificationRule_2);

        //update first classification rule properties, using the priority of the 2nd classification rule.
        classificationRule_1 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_2);
        classificationRulesApi.updateClassificationRule(projectId,
                workflowId_1, createdRule_1.getId(), classificationRule_1);

        ExistingClassificationRule updatedRule_1 = classificationRulesApi.getClassificationRule(projectId, workflowId_1,
                createdRule_1.getId());
        compareClassificationRules(classificationRule_1, updatedRule_1);;

        //verify that second classification rule priority was not updated as part of updating the first classification rule
        ExistingClassificationRule updatedRule_2 = classificationRulesApi.getClassificationRule(projectId, workflowId_1,
                createdRule_2.getId());
        compareClassificationRules(classificationRule_2, updatedRule_2);

        //verify that trying to update a classification rule that doesn't exist fails
        try{
            classificationRulesApi.updateClassificationRule(projectId, workflowId_1, ThreadLocalRandom.current().nextLong(),
                    classificationRule_1);
            Assert.fail("Expected an exception to be thrown trying to update a rule that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("not found on Workflow"),
                    "Expected message to state rule could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates some classification rules and then deletes them.")
    public void deleteClassificationRule() throws ApiException {
        Integer classificationRulePriority_1 = 1;
        BaseClassificationRule classificationRule_1 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_1);

        ExistingWorkflow workflow_1 = createWorkflow();
        Long workflowId_1 = workflow_1.getId();
        ExistingClassificationRule createdRule_1 = classificationRulesApi.createClassificationRule(projectId, workflowId_1, classificationRule_1);

        Integer classificationRulePriority_2 = 2;
        BaseClassificationRule classificationRule_2 = ObjectsInitializer.initializeClassificationRule(classificationRulePriority_2);
        ExistingClassificationRule createdRule_2 = classificationRulesApi.createClassificationRule(projectId, workflowId_1, classificationRule_2);

        //delete the first classification rule
        classificationRulesApi.deleteClassificationRule(projectId, workflowId_1, createdRule_1.getId());

        //verify that the classification rule no longer exists on the workflow
        ClassificationRules rulesOnWorkflowResult = classificationRulesApi.getClassificationRules(projectId,
                workflowId_1, 1, 100);
        Assert.assertEquals((int)rulesOnWorkflowResult.getTotalHits(), 1,
                "Total Hits should be one after deleting a classification rule.");
        Assert.assertEquals(rulesOnWorkflowResult.getClassificationRules().size(), 1,
                "One classification rule should be returned in the results.");

        ExistingClassificationRule remainingClassificationRule = rulesOnWorkflowResult.getClassificationRules().get(0);
        compareClassificationRules(classificationRule_2, remainingClassificationRule);

        Assert.assertEquals(remainingClassificationRule.getId(), createdRule_2.getId(),
                "ID of remaining classification rule should be the second classification rule that was created.");
        try{
            classificationRulesApi.getClassificationRule(projectId, workflowId_1, createdRule_1.getId());
            Assert.fail("Expecting exception to be thrown when trying to retrieve deleted classification rule.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("not found on Workflow"),
                    "Exception message should contain expected message about not finding classification rule.");
        }

        //verify that trying to delete a classification rule that doesn't exist fails
        try{
            classificationRulesApi.deleteClassificationRule(projectId, workflowId_1, ThreadLocalRandom.current().nextLong());
            Assert.fail("Expected an exception to be thrown trying to delete a rule that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Could not retrieve Classification Rule"),
                    "Expected message to state rule could not be found. Message: "+e.getMessage());
        }
    }

    /**
     * Convenience method to issue page requests against a workflow ID searching for a specified set of classification rules.
     * @param pageSize Number of classification rules to retrieve for each page request.
     * @param workflowId The workflow that classification rules are under.
     * @param classificationRulesToFind The classification rules that are expected to be returned by the page requests.
     *                                  Modified by this method to remove all those found.
     * @param expectedNumberOfClassificationRules The number of classification rules that should be under the workflow.
     * @throws ApiException
     */
    private void pageThroughClassificationRules(int pageSize, long workflowId, List<ExistingClassificationRule> classificationRulesToFind, int expectedNumberOfClassificationRules) throws ApiException {
        int classificationRulesSoFarCount = 0;
        int pageNum = 1;
        while(true){
            ClassificationRules classificationRulesPage = classificationRulesApi.getClassificationRules(projectId,
                    workflowId, pageNum, pageSize);
            Assert.assertEquals((int)classificationRulesPage.getTotalHits(), expectedNumberOfClassificationRules, "Total hits should be the same as the expected number of classification rules.");

            List<ExistingClassificationRule> retrievedClassificationRules = classificationRulesPage.getClassificationRules();

            if(pageNum*pageSize <= expectedNumberOfClassificationRules){
                //until we get to the page that includes the last result (or go beyond the number available) there should always be 'pageSize' number of results returned
                Assert.assertEquals(retrievedClassificationRules.size(), pageSize, "Expecting full page of classification rule results.");
            }
            //remove returned classification rules from list of classification rules to find
            checkClassificationRulesReturned(classificationRulesPage, classificationRulesToFind);
            //increment page num so that next call retrieves next page
            pageNum++;
            classificationRulesSoFarCount += retrievedClassificationRules.size();
            if(classificationRulesSoFarCount > expectedNumberOfClassificationRules){
                Assert.fail("More classification rules encountered than expected.");
            }
            else if(classificationRulesSoFarCount == expectedNumberOfClassificationRules){
                Assert.assertTrue(classificationRulesToFind.isEmpty(), "After encountering the expected number of classification rules there should be no more classification rules that we are searching for.");
                break;
            }
        }
        //send a final get request and verify that nothing is returned.
        ClassificationRules expectedEmptyGetResult = classificationRulesApi.getClassificationRules(projectId,
                workflowId, pageNum, pageSize);

        Assert.assertEquals((int) expectedEmptyGetResult.getTotalHits(), expectedNumberOfClassificationRules, "Total hits should report the expected number of classification rules even on a page outside range of results.");
        Assert.assertTrue(expectedEmptyGetResult.getClassificationRules().isEmpty(), "Should be no classification rules returned for page request outside expected range.");
    }

    /**
     * Search the retrieved classification rules passed for the occurrence of a set of classification rules.
     * When a match is found for a classification rule it is removed from the list of classification rules to find passed in.
     * @param retrievedClassificationRules The classification rules to search through.
     * @param classificationRulesToFind The classification rules to search for.
     */
    private void checkClassificationRulesReturned(ClassificationRules retrievedClassificationRules,
                                        List<ExistingClassificationRule> classificationRulesToFind){
        for(ExistingClassificationRule retrievedClassificationRule: retrievedClassificationRules.getClassificationRules()){
            Optional<ExistingClassificationRule> foundClassificationRule = classificationRulesToFind.stream()
                    .filter(filterClassificationRule -> filterClassificationRule.getId().equals(retrievedClassificationRule.getId())).findFirst();
            if(foundClassificationRule.isPresent()) {
                compareClassificationRules(foundClassificationRule.get(), retrievedClassificationRule);
                //remove from the list of classification rules for next check
                classificationRulesToFind.remove(foundClassificationRule.get());
            }
            else{
                Assert.fail("An unexpected classification rule was returned.");
            }
        }
    }

    /**
     * Convenience method to create a specified number of classification rules under a workflow. Returns the created classification rules.
     * @param numberOfClassificationRulesToCreate The number of classification rules to create.
     * @param workflowId The ID of the workflow to create the classification rules under.
     * @return The created classification rules.
     */
    private List<ExistingClassificationRule> createMultipleClassificationRules(int numberOfClassificationRulesToCreate, long workflowId) throws ApiException {
        List<ExistingClassificationRule> createdClassificationRules = new LinkedList<>();
        for(int numberOfClassificationRulesCreated = 0; numberOfClassificationRulesCreated < numberOfClassificationRulesToCreate; numberOfClassificationRulesCreated++){
            //create a classification rule
            BaseClassificationRule newClassificationRule = ObjectsInitializer.initializeClassificationRule(null);
            ExistingClassificationRule createdClassificationRule = classificationRulesApi.createClassificationRule(projectId,
                    workflowId, newClassificationRule);
            createdClassificationRules.add(createdClassificationRule);
        }
        return createdClassificationRules;
    }

    /**
    * Compares two classification rules.
    * @param expectedClassificationRule Classification Rule with properties set to expected values.
    * @param retrievedClassificationRule A retrieved Classification Rule to check against expected values.
    */
    private void compareClassificationRules(BaseClassificationRule expectedClassificationRule, ExistingClassificationRule retrievedClassificationRule){
        compareClassificationRules(expectedClassificationRule, retrievedClassificationRule, null);
    }

    /**
     * Compares two classification rules, allows passing in a priority to check for on the retrievedClassificationRule.
     * @param expectedClassificationRule Classification Rule with properties set to expected values.
     * @param retrievedClassificationRule A retrieved Classification Rule to check against expected values.
     * @param expectedDefaultedPriority Optional value to use to compare against retrieved Classification Rule priority.
     */
    private void compareClassificationRules(BaseClassificationRule expectedClassificationRule, ExistingClassificationRule retrievedClassificationRule,
                                            Integer expectedDefaultedPriority){
        Assert.assertEquals(retrievedClassificationRule.getName(), expectedClassificationRule.getName(),
                "Name on Classification Rule returned should match expected value.");
        Assert.assertEquals(retrievedClassificationRule.getDescription(), expectedClassificationRule.getDescription(),
                "Description on Classification Rule returned should match expected value.");
        if(expectedDefaultedPriority==null) {
            Assert.assertEquals(retrievedClassificationRule.getPriority(), expectedClassificationRule.getPriority(),
                    "Priority on Classification Rule returned should match expected value.");
        }
        else{
            Assert.assertEquals(retrievedClassificationRule.getPriority(), expectedDefaultedPriority,
                    "Priority on Classification Rule returned should have been set automatically to expected value.");
        }
    }
    /**
     * Creates a workflow.
     * @return
     */
    private ExistingWorkflow createWorkflow() throws ApiException {
        BaseWorkflow workflow = ObjectsInitializer.initializeWorkflow();
        return workflowsApi.createWorkflow(projectId, workflow);
    }
}
