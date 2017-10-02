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
package com.github.cafdataprocessing.classification.service.tests.creation;

import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationsApi;
import com.github.cafdataprocessing.classification.service.client.api.TermsApi;
import com.github.cafdataprocessing.classification.service.client.api.WorkflowsApi;
import com.github.cafdataprocessing.classification.service.client.model.ExistingClassifications;
import com.github.cafdataprocessing.classification.service.client.model.ExistingTermLists;
import com.github.cafdataprocessing.classification.service.client.model.ExistingWorkflow;
import com.github.cafdataprocessing.classification.service.client.model.ExistingWorkflows;
import com.github.cafdataprocessing.classification.service.creation.ClassificationApisProvider;
import com.github.cafdataprocessing.classification.service.creation.CreationInputJsonConverter;
import com.github.cafdataprocessing.classification.service.creation.WorkflowCreator;
import com.github.cafdataprocessing.classification.service.creation.created.CreatedApiObject;
import com.github.cafdataprocessing.classification.service.creation.created.CreationResult;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.CreationJson;
import com.github.cafdataprocessing.classification.service.tests.utils.ApiClientProvider;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Integration tests for the classification-service-creation-util project.
 */
public class CreationUtilIT {
    private final static ClassificationApisProvider apisProvider;
    private final static String classificationServiceUrl;
    private final static String testWorkflowInputFilePath;

    static {
        classificationServiceUrl = ApiClientProvider.getApiConnectionUrl();
        apisProvider = new ClassificationApisProvider(ApiClientProvider.getApiClient());

        String testWorkflowInputFileLocation = Thread.currentThread().getContextClassLoader().getResource("workflow.json").getFile();
        testWorkflowInputFilePath = new File(testWorkflowInputFileLocation).getAbsolutePath();
    }

    @Test(description = "Tests that a read in JSON creation definition is successfully created and that if create is called again "+
    " that the first set of entities created are removed and a new set created.")
    public void createCalledTwiceOverwriteDefaultTest() throws IOException, ApiException {
        WorkflowCreator workflowCreator = new WorkflowCreator(classificationServiceUrl);
        String testProjectId = UUID.randomUUID().toString();
        CreationJson expectedResultJson = CreationInputJsonConverter.readInputFile(testWorkflowInputFilePath);

        CreationResult firstCreationResult = workflowCreator.createWorkflowFromFile(testWorkflowInputFilePath, testProjectId);
        Assert.assertNotNull(firstCreationResult, "Creation result should not be null after first call to create classification workflow.");

        Long firstWorkflowCreatedId = firstCreationResult.getWorkflow().getId();
        Assert.assertEquals(firstCreationResult.getWorkflow().getName(), expectedResultJson.workflow.name,
                "First Workflow should have been created with expected name.");

        List<CreatedApiObject> firstCreatedClassifications = firstCreationResult.getClassifications();
        List<String> firstCreatedClassificationNames = firstCreatedClassifications.stream()
                .map(cl -> cl.getName())
                .collect(Collectors.toList());
        List<Long> firstCreatedClassificationIds = firstCreatedClassifications.stream()
                .map(cl -> cl.getId())
                .collect(Collectors.toList());
        List<String> expectedClassificationNames = expectedResultJson.classifications.stream()
                .map(cl -> cl.name)
                .collect(Collectors.toList());

        for(String expectedClassificationName: expectedClassificationNames){
            Assert.assertTrue(firstCreatedClassificationNames.contains(expectedClassificationName),
                    "Expected classification name should have been present in the first set of created classification names.");
        }

        List<CreatedApiObject> firstCreatedTermLists = firstCreationResult.getTermLists();
        List<String> firstCreatedTermListNames = firstCreatedTermLists.stream()
                .map(tl -> tl.getName())
                .collect(Collectors.toList());
        List<Long> firstCreatedTermListIds = firstCreatedTermLists.stream()
                .map(tl -> tl.getId())
                .collect(Collectors.toList());
        List<String> expectedTermListNames = expectedResultJson.termLists.stream()
                .map(tl -> tl.name)
                .collect(Collectors.toList());
        for(String expectedTermListName: expectedTermListNames){
            Assert.assertTrue(firstCreatedTermListNames.contains(expectedTermListName),
                    "Expected term list name should have been present in the first set of created term list names.");
        }
        //call create again and verify that the first set has been removed by checking they are not returned in retrieve calls to the API
        CreationResult secondCreationResult = workflowCreator.createWorkflowFromFile(testWorkflowInputFilePath, testProjectId);
        Assert.assertNotNull(secondCreationResult, "Creation result should not be null after second call to create classification workflow.");

        Long secondWorkflowCreatedId = secondCreationResult.getWorkflow().getId();
        Assert.assertEquals(secondCreationResult.getWorkflow().getName(), expectedResultJson.workflow.name,
                "Second Workflow should have been created with expected name.");
        Assert.assertNotEquals(secondWorkflowCreatedId, firstWorkflowCreatedId,
                "ID of second created workflow should not be the same as the first created workflow.");
        {
            //check workflow
            WorkflowsApi workflowsApi = apisProvider.getWorkflowsApi();
            ExistingWorkflows retrieveWorkflowsResult = workflowsApi.getWorkflows(testProjectId, 1, 10);
            Assert.assertEquals((int) retrieveWorkflowsResult.getTotalHits(), 1,
                    "Expecting workflow retrieval after second create to only return a single workflow.");
            ExistingWorkflow currentWorkflow = retrieveWorkflowsResult.getWorkflows().iterator().next();
            Assert.assertEquals(currentWorkflow.getId(), secondWorkflowCreatedId,
                    "The current existing workflow should have the ID of the second creation result workflow.");
        }

        {
            //check classifications
            List<CreatedApiObject> secondCreatedClassifications = secondCreationResult.getClassifications();
            List<Long> secondCreatedClassificationIds = secondCreatedClassifications.stream()
                    .map(cl -> cl.getId())
                    .collect(Collectors.toList());
            ClassificationsApi classificationsApi = apisProvider.getClassificationsApi();
            ExistingClassifications retrieveClassificationsResult = classificationsApi.getClassifications(testProjectId, 1, 100);

            Assert.assertEquals((int) retrieveClassificationsResult.getTotalHits(), expectedClassificationNames.size(),
                    "Expecting number of classifications to be only as many as intended to create.");
            List<Long> retrievedClassificationIds = retrieveClassificationsResult.getClassifications().stream()
                    .map(cl -> cl.getId())
                    .collect(Collectors.toList());
            Assert.assertTrue(retrievedClassificationIds.containsAll(secondCreatedClassificationIds),
                    "Retrieved classification IDs should match the second set of classifications created.");
            for(Long secondCreatedClassificationId: secondCreatedClassificationIds){
                Assert.assertTrue(!firstCreatedClassificationIds.contains(secondCreatedClassificationId),
                        "First set of created classification IDs should not match any of the IDs returned for second created classifications.");
            }
        }

        {
            //check term lists
            List<CreatedApiObject> secondCreatedTermLists = secondCreationResult.getTermLists();
            List<Long> secondCreatedTermListIds = secondCreatedTermLists.stream()
                    .map(tl -> tl.getId())
                    .collect(Collectors.toList());
            TermsApi termsApi = apisProvider.getTermsApi();
            ExistingTermLists retrieveTermListsResult = termsApi.getTermLists(testProjectId, 1, 100);

            Assert.assertEquals((int) retrieveTermListsResult.getTotalHits(), expectedTermListNames.size(),
                    "Expecting number of term lists to be only as many as intended to create.");
            List<Long> retrievedTermListsIds = retrieveTermListsResult.getTermLists().stream()
                    .map(tl -> tl.getId())
                    .collect(Collectors.toList());
            Assert.assertTrue(retrievedTermListsIds.containsAll(secondCreatedTermListIds),
                    "Retrieved term list IDs should match the second set of term lists created.");
            for(Long secondCreatedTermListId: secondCreatedTermListIds){
                Assert.assertTrue(!firstCreatedTermListIds.contains(secondCreatedTermListId),
                        "First set of created term list IDs should not match any of the IDs returned for second created term lists.");
            }
        }
    }

    @Test(description = "Tests that a read in JSON creation definition is successfully created and that if create is called again "+
            " that the first set of entities created are not removed and a new set created.")
    public void createCalledTwiceOverwriteFalseTest() throws IOException, ApiException {
        WorkflowCreator workflowCreator = new WorkflowCreator(classificationServiceUrl);
        String testProjectId = UUID.randomUUID().toString();
        CreationJson expectedResultJson = CreationInputJsonConverter.readInputFile(testWorkflowInputFilePath);

        CreationResult firstCreationResult = workflowCreator.createWorkflowFromFile(testWorkflowInputFilePath, testProjectId, false);
        Assert.assertNotNull(firstCreationResult, "Creation result should not be null after first call to create classification workflow.");

        Long firstWorkflowCreatedId = firstCreationResult.getWorkflow().getId();
        Assert.assertEquals(firstCreationResult.getWorkflow().getName(), expectedResultJson.workflow.name,
                "First Workflow should have been created with expected name.");

        List<CreatedApiObject> firstCreatedClassifications = firstCreationResult.getClassifications();
        List<String> firstCreatedClassificationNames = firstCreatedClassifications.stream()
                .map(cl -> cl.getName())
                .collect(Collectors.toList());
        List<Long> firstCreatedClassificationIds = firstCreatedClassifications.stream()
                .map(cl -> cl.getId())
                .collect(Collectors.toList());
        List<String> expectedClassificationNames = expectedResultJson.classifications.stream()
                .map(cl -> cl.name)
                .collect(Collectors.toList());

        for(String expectedClassificationName: expectedClassificationNames){
            Assert.assertTrue(firstCreatedClassificationNames.contains(expectedClassificationName),
                    "Expected classification name should have been present in the first set of created classification names.");
        }

        List<CreatedApiObject> firstCreatedTermLists = firstCreationResult.getTermLists();
        List<String> firstCreatedTermListNames = firstCreatedTermLists.stream()
                .map(tl -> tl.getName())
                .collect(Collectors.toList());
        List<Long> firstCreatedTermListIds = firstCreatedTermLists.stream()
                .map(tl -> tl.getId())
                .collect(Collectors.toList());
        List<String> expectedTermListNames = expectedResultJson.termLists.stream()
                .map(tl -> tl.name)
                .collect(Collectors.toList());
        for(String expectedTermListName: expectedTermListNames){
            Assert.assertTrue(firstCreatedTermListNames.contains(expectedTermListName),
                    "Expected term list name should have been present in the first set of created term list names.");
        }
        //call create again and verify that the first set has not been removed by checking they are returned in retrieve calls to the API
        CreationResult secondCreationResult = workflowCreator.createWorkflowFromFile(testWorkflowInputFilePath, testProjectId,
                false);
        Assert.assertNotNull(secondCreationResult, "Creation result should not be null after second call to create classification workflow.");

        Long secondWorkflowCreatedId = secondCreationResult.getWorkflow().getId();
        Assert.assertEquals(secondCreationResult.getWorkflow().getName(), expectedResultJson.workflow.name,
                "Second Workflow should have been created with expected name.");
        Assert.assertNotEquals(secondWorkflowCreatedId, firstWorkflowCreatedId,
                "ID of second created workflow should not be the same as the first created workflow.");
        {
            //check workflow
            WorkflowsApi workflowsApi = apisProvider.getWorkflowsApi();
            ExistingWorkflows retrieveWorkflowsResult = workflowsApi.getWorkflows(testProjectId, 1, 10);
            Assert.assertEquals((int) retrieveWorkflowsResult.getTotalHits(), 2,
                    "Expecting workflow retrieval after second create to return both workflows.");
            List<Long> expectedIds = new ArrayList<>();
            expectedIds.add(secondWorkflowCreatedId);
            expectedIds.add(firstWorkflowCreatedId);
            Assert.assertTrue(retrieveWorkflowsResult.getWorkflows().stream()
                            .map(wf -> wf.getId()).collect(Collectors.toList())
                            .containsAll(expectedIds),
                    "Expecting both workflow IDs to have been returned in retrieve call.");
        }

        {
            //check classifications
            List<CreatedApiObject> secondCreatedClassifications = secondCreationResult.getClassifications();
            List<Long> secondCreatedClassificationIds = secondCreatedClassifications.stream()
                    .map(cl -> cl.getId())
                    .collect(Collectors.toList());
            ClassificationsApi classificationsApi = apisProvider.getClassificationsApi();
            ExistingClassifications retrieveClassificationsResult = classificationsApi.getClassifications(testProjectId, 1, 100);

            Assert.assertEquals((int) retrieveClassificationsResult.getTotalHits(),
                    firstCreatedClassificationIds.size() + secondCreatedClassificationIds.size(),
                    "Expecting number of classifications to be the number in first set plus second set.");
            List<Long> retrievedClassificationIds = retrieveClassificationsResult.getClassifications().stream()
                    .map(cl -> cl.getId())
                    .collect(Collectors.toList());
            List<Long> expectedIds = new ArrayList<>(firstCreatedClassificationIds);
            expectedIds.addAll(secondCreatedClassificationIds);
            Assert.assertTrue(retrievedClassificationIds.containsAll(expectedIds),
                    "Retrieved classification IDs should contain the first and second set of classification IDs created.");
        }

        {
            //check term lists
            List<CreatedApiObject> secondCreatedTermLists = secondCreationResult.getTermLists();
            List<Long> secondCreatedTermListIds = secondCreatedTermLists.stream()
                    .map(tl -> tl.getId())
                    .collect(Collectors.toList());
            TermsApi termsApi = apisProvider.getTermsApi();
            ExistingTermLists retrieveTermListsResult = termsApi.getTermLists(testProjectId, 1, 100);

            Assert.assertEquals((int) retrieveTermListsResult.getTotalHits(),
                    firstCreatedTermListIds.size() + secondCreatedTermListIds.size(),
                    "Expecting number of term lists to be the number in first set plus second set.");
            List<Long> retrievedTermListsIds = retrieveTermListsResult.getTermLists().stream()
                    .map(tl -> tl.getId())
                    .collect(Collectors.toList());
            List<Long> expectedIds = new ArrayList<>(firstCreatedTermListIds);
            expectedIds.addAll(secondCreatedTermListIds);
            Assert.assertTrue(retrievedTermListsIds.containsAll(expectedIds),
                    "Retrieved term list IDs should contain the first and second set of term list IDs created.");
        }
    }
}
