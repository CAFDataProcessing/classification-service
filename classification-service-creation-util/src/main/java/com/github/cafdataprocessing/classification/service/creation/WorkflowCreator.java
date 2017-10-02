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
package com.github.cafdataprocessing.classification.service.creation;

import com.github.cafdataprocessing.classification.service.client.ApiClient;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.*;
import com.github.cafdataprocessing.classification.service.client.model.*;
import com.github.cafdataprocessing.classification.service.creation.created.*;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.*;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Creates a classification workflow based on provided input data.
 */
public class WorkflowCreator {
    private final WorkflowsApi workflowsApi;
    private final ClassificationRulesApi classificationRulesApi;
    private final RuleConditionsApi ruleConditionsApi;
    private final RuleClassificationsApi ruleClassificationsApi;
    private final TermsApi termsApi;
    private final ClassificationsApi classificationsApi;

    private final ClassificationApisProvider apisProvider;

    private final TermListNameResolver termListNameResolver;
    private final ClassificationNameResolver classificationNameResolver;

    /**
     * Creates an instance of WorkflowCreator class.
     * @param classificationApiUrl URL of the Classification API to use in creating workflow.
     */
    public WorkflowCreator(String classificationApiUrl){
        this(classificationApiUrl, new TermListNameResolver(),
                new ClassificationNameResolver());
    }

    /**
     * Creates an instance of a WorkflowCreator class. The provided TermListNameResolver and ClassificationNameResolver
     * will be used in workflow creation.
     * @param classificationApiUrl URL of the Classification API to use in creating workflow.
     * @param termListNameResolver Will be used to resolve the names of term lists specified in workflows being created to
     *                             their IDs.
     * @param classificationNameResolver Will be used to resolve the names of classifications specified in workflows
     *                                   being created to their IDs.
     */
    public WorkflowCreator(String classificationApiUrl, TermListNameResolver termListNameResolver,
                           ClassificationNameResolver classificationNameResolver){
        final ApiClient apiClient = new ApiClient();
        apiClient.setBasePath(classificationApiUrl);
        this.apisProvider = new ClassificationApisProvider(apiClient);
        workflowsApi = apisProvider.getWorkflowsApi();
        classificationRulesApi = apisProvider.getClassificationRulesApi();
        ruleConditionsApi = apisProvider.getRuleConditionsApi();
        ruleClassificationsApi = apisProvider.getRuleClassificationsApi();
        termsApi = apisProvider.getTermsApi();
        classificationsApi = apisProvider.getClassificationsApi();
        this.termListNameResolver = termListNameResolver;
        this.classificationNameResolver = classificationNameResolver;
    }

    /**
     * Creates a workflow using definition read from the provided file. If any workflows already exist with the
     * same name as the read in workflow they will be removed.
     * @param workflowFile File containing a definition of a classification workflow.
     * @param projectId ProjectID that workflow objects should be created using.
     * @return Details of created workflow.
     * @throws IOException Thrown when an error is encountered reading workflow definition from file.
     * @throws ApiException Thrown when an error is encountered calling the Classification API.
     */
    public CreationResult createWorkflowFromFile(File workflowFile, String projectId) throws IOException, ApiException {
        return createWorkflowFromFile(workflowFile, projectId, true);
    }

    /**
     * Creates a workflow using definition read from the provided file.
     * @param workflowFile File containing a definition of a classification workflow.
     * @param projectId ProjectID that workflow objects should be created using.
     * @param overwriteExisting Whether any existing workflows that match the name of the workflow specified in the input file should be removed
     *                          before creation.
     * @return Details of created workflow.
     * @throws IOException Thrown when an error is encountered reading workflow definition from file.
     * @throws ApiException Thrown when an error is encountered calling the Classification API.
     */
    public CreationResult createWorkflowFromFile(File workflowFile, String projectId, boolean overwriteExisting)
            throws IOException, ApiException {
        CreationJson creationJson = CreationInputJsonConverter.readInputFile(workflowFile);
        return createWorkflowFromCreationJson(creationJson, projectId, overwriteExisting);
    }

    /**
     * Creates a workflow using definition read from the provided file location. If any workflows already exist with the
     * same name as the read in workflow they will be removed.
     * @param workflowFileLocation Location of a file containing a definition of a classification workflow.
     * @param projectId ProjectID that workflow objects should be created using.
     * @return Details of created workflow.
     * @throws IOException Thrown when an error is encountered reading workflow definition from file.
     * @throws ApiException Thrown when an error is encountered calling the Classification API.
     */
    public CreationResult createWorkflowFromFile(String workflowFileLocation, String projectId)
            throws IOException, ApiException {
        return createWorkflowFromFile(workflowFileLocation, projectId, true);
    }

    /**
     * Creates a workflow using definition read from the provided file location.
     * @param workflowFileLocation Location of a file containing a definition of a classification workflow.
     * @param projectId ProjectID that workflow objects should be created using.
     * @param overwriteExisting Whether any existing workflows that match the name of the workflow specified in the input file should be removed
     *                          before creation.
     * @return Details of created workflow.
     * @throws IOException Thrown when an error is encountered reading workflow definition from file.
     * @throws ApiException Thrown when an error is encountered calling the Classification API.
     */
    public CreationResult createWorkflowFromFile(String workflowFileLocation, String projectId, boolean overwriteExisting)
            throws IOException, ApiException {
        CreationJson creationJson = CreationInputJsonConverter.readInputFile(workflowFileLocation);
        return createWorkflowFromCreationJson(creationJson, projectId, overwriteExisting);
    }

    /**
     * Creates a workflow using provided parameters. If workflow file is not provided then
     * @param createParams Parameters to use in creation. Workflow to create will first attempt to be read from
     *                     workflowBaseDataFile on object and if it is not set then workflowFileLocation will be used to
     *                     load the file containing the workflow JSON.
     * @return Details of created workflow.
     * @throws ApiException Thrown when an error is encountered calling the Classification API.
     * @throws IOException Thrown when an error is encountered reading workflow definition from file.
     * @throws NullPointerException If neither workflowBaseDataFile or workflowFileLocation is set on {@code createParams}.
     */
    public CreationResult createWorkflowFromFile(ClassificationWorkflowCreateParams createParams)
            throws ApiException, IOException, NullPointerException{
        File workflowFile = createParams.getWorkflowBaseDataFile();
        if(workflowFile!=null){
            CreationJson creationJson = CreationInputJsonConverter.readInputFile(workflowFile);
            return createWorkflowFromCreationJson(creationJson,
                    createParams.getProjectId(),
                    createParams.getOverwriteExisting());
        }
        String workflowFileLocation = createParams.getWorkflowBaseDataFileName();
        Objects.requireNonNull(workflowFileLocation);
        CreationJson creationJson = CreationInputJsonConverter.readInputFile(workflowFileLocation);
        return createWorkflowFromCreationJson(creationJson,
                createParams.getProjectId(),
                createParams.getOverwriteExisting());
    }

    private CreationResult createWorkflowFromCreationJson(CreationJson creationJson,
                                                          String projectId,
                                                          boolean overwriteExisting)
            throws ApiException {
        if(overwriteExisting){
            ClassificationWorkflowRemover.removeMatching(apisProvider, projectId, creationJson);
        }

        List<CreatedApiObject> createdTermLists = createTermLists(creationJson.termLists, projectId);
        List<CreatedApiObject> createdClassifications = createClassifications(creationJson.classifications, projectId);
        CreatedWorkflow createdWorkflow = createWorkflow(creationJson.workflow, projectId);
        return new CreationResult(createdWorkflow, createdTermLists, createdClassifications);
    }

    private List<CreatedApiObject> createClassifications(List<ClassificationJson> classificationJsons, String projectId) throws ApiException {
        List<CreatedApiObject> createdClassifications = new ArrayList<>();
        for(ClassificationJson classificationJson: classificationJsons){
            ExistingClassification createdClassification = classificationsApi.createClassification(projectId,
                    classificationJson.toApiBaseClassification(termListNameResolver));
            classificationNameResolver.addNameAndId(createdClassification.getName(), createdClassification.getId());
            createdClassifications.add(new CreatedApiObject(createdClassification.getId(),
                    createdClassification.getName()));
        }
        return createdClassifications;
    }

    private List<CreatedApiObject> createTermLists(List<TermListJson> termListJsons, String projectId) throws ApiException {
        List<CreatedApiObject> createdTermLists = new ArrayList<>();
        for(TermListJson termListJson: termListJsons) {
            ExistingTermList createdTermList =
                    termsApi.createTermList(projectId, termListJson.toApiTermList());
            termListNameResolver.addNameAndId(createdTermList.getName(), createdTermList.getId());
            addTerms(termListJson.terms, createdTermList.getId(), projectId);
            createdTermLists.add(new CreatedApiObject(createdTermList.getId(), createdTermList.getName()));
        }
        return createdTermLists;
    }

    private void addTerms(List<TermJson> termJsons, long termListId, String projectId) throws ApiException {
        NewTerms termsToCreate = new NewTerms();
        termsToCreate.setTerms(termJsons.stream().map(termJson -> termJson.toApiTerm()).collect(Collectors.toList()));
        termsApi.updateTerms(projectId, termListId, termsToCreate);
    }

    private CreatedWorkflow createWorkflow(WorkflowJson workflowJson, String projectId) throws ApiException {
        ExistingWorkflow apiWorkflow = workflowsApi.createWorkflow(projectId, workflowJson.toApiBaseWorkflow());
        CreatedWorkflow createdWorkflow = new CreatedWorkflow(apiWorkflow.getId(), apiWorkflow.getName());
        for(ClassificationRuleJson ruleToCreate: workflowJson.classificationRules){
            CreatedClassificationRule createdClassificationRule = createClassificationRule(ruleToCreate, apiWorkflow.getId(), projectId);
            createdWorkflow.addClassificationRule(createdClassificationRule);
        }
        return createdWorkflow;
    }

    private CreatedClassificationRule createClassificationRule(ClassificationRuleJson classificationRuleJson, long workflowId, String projectId) throws ApiException {
        ExistingClassificationRule apiClassificationRule = classificationRulesApi.createClassificationRule(projectId, workflowId,
                classificationRuleJson.toApiBaseClassificationRule());
        long createdClassificationRuleId = apiClassificationRule.getId();
        CreatedClassificationRule createdClassificationRule = new CreatedClassificationRule(createdClassificationRuleId,
                apiClassificationRule.getName());
        List<CreatedApiObject> createdRuleConditions =
        createRuleConditions(classificationRuleJson.ruleConditions, workflowId, createdClassificationRuleId,
                projectId);
        createdClassificationRule.getRuleConditions().addAll(createdRuleConditions);
        List<CreatedRuleClassification> createdRuleClassifications =
        createRuleClassifications(classificationRuleJson.ruleClassifications, workflowId, createdClassificationRuleId,
                projectId);
        createdClassificationRule.getRuleClassifications().addAll(createdRuleClassifications);

        return createdClassificationRule;
    }

    private List<CreatedApiObject> createRuleConditions(List<ConditionJson> ruleConditions, long workflowId, long classificationRuleId,
                                      String projectId) throws ApiException {
        List<CreatedApiObject> createdRuleConditions = new ArrayList<>();
        for(ConditionJson conditionToCreate: ruleConditions){
            ExistingCondition apiCondition = ruleConditionsApi.createClassificationRuleCondition(projectId, workflowId, classificationRuleId,
                    conditionToCreate.toApiCondition(this.termListNameResolver));
            createdRuleConditions.add(new CreatedApiObject(apiCondition.getId(), apiCondition.getName()));
        }
        return createdRuleConditions;
    }

    private List<CreatedRuleClassification> createRuleClassifications(List<RuleClassificationJson> ruleClassificationJsons, long workflowId,
                                           long classificationRuleId, String projectId) throws ApiException {
        List<CreatedRuleClassification> createdRuleClassifications = new ArrayList<>();
        for(RuleClassificationJson ruleClassificationToCreate: ruleClassificationJsons){
            ExistingRuleClassification apiRuleClassification = ruleClassificationsApi.createRuleClassification(projectId, workflowId, classificationRuleId,
                    ruleClassificationToCreate.toApiRuleClassification(classificationNameResolver));
            createdRuleClassifications.add(new CreatedRuleClassification(apiRuleClassification.getId(), apiRuleClassification.getClassificationId()));
        }
        return createdRuleClassifications;
    }
}
