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
package com.github.cafdataprocessing.classification.service.creation.jsonobjects;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/**
 * JSON representation of objects to be created using the classification web service
 */
public class CreationJson {
    public final List<ClassificationJson> classifications;
    public final List<TermListJson> termLists;
    public final WorkflowJson workflow;

    public CreationJson(@JsonProperty(value= "workflow", required = true)WorkflowJson workflow,
                        @JsonProperty(value= "termLists")List<TermListJson> termLists,
                        @JsonProperty(value= "classifications")List<ClassificationJson> classifications){
        this.classifications = classifications;
        this.workflow = workflow;
        this.termLists = termLists == null ? new ArrayList<>() : termLists;
    }
}
