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
package com.github.cafdataprocessing.classification.service.tests.utils;

import com.github.cafdataprocessing.classification.service.client.ApiClient;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationRulesApi;
import com.github.cafdataprocessing.classification.service.client.api.RuleConditionsApi;
import com.github.cafdataprocessing.classification.service.client.api.WorkflowsApi;
import com.github.cafdataprocessing.classification.service.client.model.*;

/**
 * Creates classification service API types, calling the running API create methods and returning the response object.
 */
public class ObjectsCreator {
    private static ClassificationRulesApi classificationRulesApi;
    private static WorkflowsApi workflowsApi;
    private static RuleConditionsApi ruleConditionsApi;
    private String projectId;

    static {
        ApiClient apiClient = ApiClientProvider.getApiClient();
        workflowsApi = new WorkflowsApi(apiClient);
        classificationRulesApi = new ClassificationRulesApi(apiClient);
        ruleConditionsApi = new RuleConditionsApi(apiClient);
    }

    /**
     * Creates a workflow.
     * @param projectId projectId to create workflow under.
     * @return
     */
    public static ExistingWorkflow createWorkflow(String projectId) throws ApiException {
        BaseWorkflow workflow = ObjectsInitializer.initializeWorkflow();
        return workflowsApi.createWorkflow(projectId, workflow);
    }

    /**
     * Creates a workflow.
     * @param projectId projectId to create classification rule under.
     * @param workflowId The workflow to create the classification rule under.
     * @param priority priority to set on the classification rule.
     * @return
     */
    public static ExistingClassificationRule createClassificationRule(String projectId, long workflowId, Integer priority) throws ApiException {
        BaseClassificationRule classificationRule = ObjectsInitializer.initializeClassificationRule(priority);
        return classificationRulesApi.createClassificationRule(projectId, workflowId, classificationRule);
    }
}
