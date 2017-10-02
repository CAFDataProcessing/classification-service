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

import java.io.File;

/**
 * Holds properties that can be passed when creating a workflow to the WorkflowCreator class.
 */
public class ClassificationWorkflowCreateParams {
    /**
     * ProjectId to create workflow under.
     */
    private final String projectId;
    /**
     * Path to file containing classification workflow in JSON format that should be created.
     */
    private String workflowBaseDataFileName = null;
    /**
     * File containing JSON format workflow to create.
     */
    private File workflowBaseDataFile = null;
    /**
     * Whether existing workflows under the {@code projectId} with the same name as the provided workflow should be removed.
     */
    private boolean overwriteExisting = true;

    /**
     * Create the parameter object with required properties providing a path to file containing the workflow definition.
     * @param workflowBaseDataFileName Path to file containing workflow in JSON format that should be created.
     * @param projectId ProjectId to create workflow under.
     */
    public ClassificationWorkflowCreateParams(final String workflowBaseDataFileName, final String projectId){
        this.workflowBaseDataFileName = workflowBaseDataFileName;
        this.projectId = projectId;
    }

    /**
     * Create the parameter object with required properties providing a file containing the workflow definition.
     * @param workflowBaseDataFile File containing JSON format workflow to create.
     * @param projectId ProjectId to create workflow under.
     */
    public ClassificationWorkflowCreateParams(final File workflowBaseDataFile, final String projectId){
        this.workflowBaseDataFile = workflowBaseDataFile;
        this.projectId = projectId;
    }

    public boolean getOverwriteExisting(){
        return overwriteExisting;
    }

    public String getProjectId(){
        return projectId;
    }

    public String getWorkflowBaseDataFileName(){
        return workflowBaseDataFileName;
    }

    public File getWorkflowBaseDataFile(){
        return workflowBaseDataFile;
    }

    public void setOverwriteExisting(boolean overwriteExisting){
        this.overwriteExisting = overwriteExisting;
    }
}
