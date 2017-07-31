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
package com.github.cafdataprocessing.classification.service.creation;

import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationRulesApi;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationsApi;
import com.github.cafdataprocessing.classification.service.client.api.TermsApi;
import com.github.cafdataprocessing.classification.service.client.api.WorkflowsApi;
import com.github.cafdataprocessing.classification.service.client.model.*;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.ClassificationJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.CreationJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.TermListJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.WorkflowJson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Removes a classification workflow (including its components), classifications and termlists based on project ID and
 * matching names in preparation for creating new workflows, classifications and termlists.
 */
public class ClassificationWorkflowRemover {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClassificationWorkflowRemover.class);

    /**
     * Removes existing workflows (including classification rules etc under the workflow), classifications and termlists
     * that have names matching those in the provided CreationJson.
     * @param apisProvider Provides access to classification service APIs so retrieval and delete requests may be sent via
     *                     the appropriate API.
     * @param projectId ProjectId that items to check are under.
     * @param creationJson Definition of classification workflow, classifications and term lists to create. The names to check
     *                     will be taken from these elements.
     * @throws ApiException If an error occurs contacting the classification service via the APIs.
     */
    public static void removeMatching(ClassificationApisProvider apisProvider, String projectId,
                              CreationJson creationJson) throws ApiException {
        WorkflowJson workflowToCheck = creationJson.workflow;
        if(workflowToCheck!=null) {
            removeMatchingWorkflows(apisProvider, projectId, workflowToCheck.name);
        }
        List<ClassificationJson> classificationsToCheck = creationJson.classifications;
        if(classificationsToCheck!=null && !classificationsToCheck.isEmpty()){
            removeMatchingClassifications(apisProvider, projectId, classificationsToCheck
                    .stream()
                    .map(cl -> cl.name)
                    .collect(Collectors.toList()));
        }
        List<TermListJson> termListsToCheck = creationJson.termLists;
        if(termListsToCheck!=null && !termListsToCheck.isEmpty()){
            removeMatchingTermlists(apisProvider, projectId, termListsToCheck
                    .stream()
                    .map(tl -> tl.name)
                    .collect(Collectors.toList()));
        }
    }

    /**
     * Removes any existing term lists that match the names provided
     * under the projectId.
     * @param apisProvider Provides access to classification service APIs so retrieval and delete requests may be sent via
     *                     the appropriate API.
     * @param projectId ProjectId that term lists to check are under.
     * @param termListNamesToRemove Names to check existing term lists against. If an existing term list matches
     *                                    any of these names it will be removed.
     * @throws ApiException If an error occurs contacting the classification API. Will occur if a term list that is to be removed
     * is in use on a classification.
     */
    public static void removeMatchingTermlists(ClassificationApisProvider apisProvider, String projectId,
                                               List<String> termListNamesToRemove) throws ApiException {
        LOGGER.info("Checking for existing termlists that should be removed.");
        if(termListNamesToRemove==null || termListNamesToRemove.isEmpty()){
            LOGGER.info("No term list names to check have been provided. Term lists will not be checked.");
            return;
        }
        TermsApi termsApi = apisProvider.getTermsApi();
        List<ExistingTermList> existingTermLists = new ArrayList<>();
        {
            int pageNum = 1;
            int pageSize = 100;
            LOGGER.debug("Retrieving existing term lists to check their names.");
            while(true){
                ExistingTermLists retrieveTermListsResult = termsApi.getTermLists(projectId, pageNum, pageSize);
                existingTermLists.addAll(retrieveTermListsResult.getTermLists());
                if(retrieveTermListsResult.getTotalHits() <= pageNum*pageSize){
                    break;
                }
                pageNum++;
            }
            LOGGER.debug("Retrieved all existing term lists.");
        }
        if(existingTermLists.isEmpty()){
            LOGGER.info("There are no existing term lists to remove.");
            return;
        }
        for(ExistingTermList existingTermList: existingTermLists){
            String existingTermListName = existingTermList.getName();
            if(termListNamesToRemove.contains(existingTermListName)){
                Long existingTermListId = existingTermList.getId();
                LOGGER.debug("Existing term list matches name: "+existingTermListName+", has ID: "+
                existingTermListId+". Term list will be removed.");
                termsApi.deleteTermList(projectId, existingTermListId);
                LOGGER.debug("Removed term list with ID: "+existingTermListId);
            }
        }
        LOGGER.info("Removed any existing term lists with matching names.");
    }

    /**
     * Removes any existing classifications that match the names provided
     * under the projectId.
     * @param apisProvider Provides access to classification service APIs so retrieval and delete requests may be sent via
     *                     the appropriate API.
     * @param projectId ProjectId that classifications to check are under.
     * @param classificationNamesToRemove Names to check existing classifications against. If an existing classification matches
     *                                    any of these names it will be removed.
     * @throws ApiException If an error occurs contacting the classification API. Will occur if a classification that is to be removed
     * is in use on a workflow rule classification.
     */
    public static void removeMatchingClassifications(ClassificationApisProvider apisProvider, String projectId,
                                                     List<String> classificationNamesToRemove) throws ApiException {
        LOGGER.info("Checking for existing classifications that should be removed.");
        if(classificationNamesToRemove==null || classificationNamesToRemove.isEmpty()){
            LOGGER.info("No classification names to check have been provided. Classifications will not be checked.");
            return;
        }
        ClassificationsApi classificationsApi = apisProvider.getClassificationsApi();
        List<ExistingClassification> existingClassifications = new ArrayList<>();
        {
            int pageNum = 1;
            int pageSize = 100;
            LOGGER.debug("Retrieving existing classifications to check their names.");
            while(true){
                ExistingClassifications retrieveClassificationsResult = classificationsApi.getClassifications(projectId, pageNum, pageSize);
                existingClassifications.addAll(retrieveClassificationsResult.getClassifications());
                if(retrieveClassificationsResult.getTotalHits() <= pageNum*pageSize){
                    break;
                }
                pageNum++;
            }
            LOGGER.debug("Retrieved all existing classifications.");
        }
        if(existingClassifications.isEmpty()){
            LOGGER.info("There are no existing classifications to remove.");
            return;
        }
        for(ExistingClassification existingClassification: existingClassifications){
            String existingClassificationName = existingClassification.getName();
            if(classificationNamesToRemove.contains(existingClassificationName)){
                Long existingClassificationId = existingClassification.getId();
                LOGGER.debug("Existing classification matches name: "+existingClassificationName+", has ID: "+existingClassificationId+
                        ". Classification will be removed.");
                classificationsApi.deleteClassification(projectId, existingClassificationId);
                LOGGER.debug("Removed classification with ID: "+existingClassificationId);
            }
        }
        LOGGER.info("Removed any existing classifications with matching names.");
    }

    /**
     * Removes any existing workflows (including classification rules etc under the workflow) under the specified projectId
     * that match the name provided.
     * @param apisProvider Provides access to classification service APIs so retrieval and delete requests may be sent via
     *                     the appropriate API.
     * @param projectId ProjectId that checked workflows should be under.
     * @param workflowNameToRemove If any workflows have a name that matches this value they will be removed.
     * @throws ApiException If an error occurs contacting the classification API.
     */
    public static void removeMatchingWorkflows(ClassificationApisProvider apisProvider, String projectId,
                                      String workflowNameToRemove) throws ApiException {
        LOGGER.info("Checking for existing classification workflows that should be removed using name: "
                +workflowNameToRemove);
        if(workflowNameToRemove==null){
            LOGGER.info("Workflow name to use in checking existing classification workflows to remove cannot be null. Workflows will not be checked.");
            return;
        }
        WorkflowsApi workflowsApi = apisProvider.getWorkflowsApi();
        List<ExistingWorkflow> existingWorkflows = new ArrayList<>();
        {
            int pageNum = 1;
            int pageSize = 100;
            LOGGER.debug("Retrieving existing classification workflows to check their names.");
            while(true) {
                ExistingWorkflows retrieveWorkflowsResult = workflowsApi.getWorkflows(projectId, pageNum, pageSize);
                existingWorkflows.addAll(retrieveWorkflowsResult.getWorkflows());
                //check if there are more workflows to retrieve
                if(retrieveWorkflowsResult.getTotalHits() <= pageNum*pageSize){
                    break;
                }
                pageNum++;
            }
            LOGGER.debug("Retrieved all existing classification workflows.");
        }

        if(existingWorkflows.isEmpty()){
            LOGGER.info("There are no existing classification workflows to remove.");
            return;
        }
        ClassificationRulesApi classificationRulesApi = apisProvider.getClassificationRulesApi();
        for(ExistingWorkflow existingWorkflow: existingWorkflows){
            Long existingWorkflowId = existingWorkflow.getId();
            if(existingWorkflow.getName().equals(workflowNameToRemove)){
                LOGGER.debug("Existing classification workflow matches name: "+workflowNameToRemove+", has ID: "+existingWorkflowId+
                        ". Workflow will be removed.");
                List<ExistingClassificationRule> classificationRulesToRemove = new ArrayList<>();
                int pageNum = 1;
                int pageSize = 100;
                while(true) {
                    ClassificationRules retrieveClassificationRulesResult =
                            classificationRulesApi.getClassificationRules(projectId, existingWorkflowId, pageNum, pageSize);
                    classificationRulesToRemove.addAll(retrieveClassificationRulesResult.getClassificationRules());
                    if(retrieveClassificationRulesResult.getTotalHits() <= pageNum*pageSize){
                        break;
                    }
                    pageNum++;
                }

                removeClassificationRules(classificationRulesApi, projectId, existingWorkflowId, classificationRulesToRemove);
                LOGGER.debug("Removed all classification rules for workflow: "+existingWorkflowId);
                workflowsApi.deleteWorkflow(projectId, existingWorkflowId);
                LOGGER.debug("Removed classification workflow: "+existingWorkflowId);
            }
        }
        LOGGER.info("Removed any existing classification workflows with name: "+workflowNameToRemove);
    }

    private static void removeClassificationRules(ClassificationRulesApi classificationRulesApi, String projectId,
                                                  Long workflowId, List<ExistingClassificationRule> classificationRulesToRemove)
            throws ApiException {
        for(ExistingClassificationRule classificationRuleToRemove: classificationRulesToRemove){
            Long ruleToRemoveId = classificationRuleToRemove.getId();
            LOGGER.debug("Removing classification rule with ID: "+ ruleToRemoveId +
                    " under workflow with ID: "+workflowId);
            classificationRulesApi.deleteClassificationRule(projectId, workflowId, ruleToRemoveId);
            LOGGER.debug("Removed classification rule with ID: "+ruleToRemoveId);
        }
    }
}
