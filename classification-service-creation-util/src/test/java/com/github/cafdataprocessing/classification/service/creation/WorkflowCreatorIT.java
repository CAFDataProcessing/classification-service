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

import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.creation.created.CreationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

/**
 * Tests that classification Workflow can be created through the WorkflowCreator class
 */
public class WorkflowCreatorIT {
    private static final Logger LOGGER = LoggerFactory.getLogger(WorkflowCreatorIT.class);

    private static String testClassificationApiUrl;
    private static File testWorkflowInput;

    @BeforeClass
    public void setup() {
        testClassificationApiUrl = System.getenv("test.classificationApiUrl");
        if(StringUtils.isNullOrEmpty(testClassificationApiUrl)){
            LOGGER.error("Required system property 'test.classificationApiUrl' not specified. Calls to API will fail.");
        }
        String workflowInputFileLocation = System.getenv("test.workflowInputLocation");
        if(StringUtils.isNullOrEmpty(workflowInputFileLocation)){
            LOGGER.error("Required system property 'test.workflowInputLocation' not specified. Unable to load workflow input file for tests.");
        }
        testWorkflowInput = new File(workflowInputFileLocation);
    }

    //disabled test by default. Useful for developer testing against already stood-up API.
    @Test(enabled = false)
    public void createExampleWorkflow() throws IOException, ApiException {
        String projectId = UUID.randomUUID().toString();
        WorkflowCreator creator = new WorkflowCreator(testClassificationApiUrl);
        CreationResult creationResult = creator.createWorkflowFromFile(testWorkflowInput, projectId);
        Assert.assertNotNull(creationResult, "Expecting created workflow information to have been returned.");
    }
}
