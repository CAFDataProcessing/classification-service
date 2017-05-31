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
package com.github.cafdataprocessing.classification.service.creation.created;

import java.util.List;

/**
 * Holds information for the objects created.
 */
public class CreationResult {
    private CreatedWorkflow workflow;
    private List<CreatedApiObject> termLists;
    private List<CreatedApiObject> classifications;

    /**
     * Parameterless constructor to support JSON deserialization.
     */
    public CreationResult(){}

    public CreationResult(CreatedWorkflow workflow, List<CreatedApiObject> termLists, List<CreatedApiObject> classifications) {
        this.workflow = workflow;
        this.termLists = termLists;
        this.classifications = classifications;
    }

    public CreatedWorkflow getWorkflow(){
        return workflow;
    }

    public void setWorkflow(CreatedWorkflow workflow){
        this.workflow = workflow;
    }

    public List<CreatedApiObject> getTermLists(){
        return termLists;
    }

    public void setTermLists(List<CreatedApiObject> termLists){
        this.termLists = termLists;
    }

    public List<CreatedApiObject> getClassifications(){
        return classifications;
    }

    public void setClassifications(List<CreatedApiObject> classifications){
        this.classifications = classifications;
    }
}
