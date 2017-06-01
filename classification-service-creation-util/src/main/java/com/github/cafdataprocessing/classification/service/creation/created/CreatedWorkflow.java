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

import java.util.ArrayList;
import java.util.List;

/**
 * Information on a workflow that was created
 */
public class CreatedWorkflow extends CreatedApiObject{
    private List<CreatedClassificationRule> classificationRules = new ArrayList<>();

    /**
     * Parameterless constructor to support JSON deserialization.
     */
    public CreatedWorkflow(){
        super();
    }

    public CreatedWorkflow(long id, String name){
        super(id, name);
    }

    public void addClassificationRule(CreatedClassificationRule rule){
        classificationRules.add(rule);
    }

    public List<CreatedClassificationRule> getClassificationRules(){
        return classificationRules;
    }

    public void setClassificationRules(List<CreatedClassificationRule> classificationRules){
        this.classificationRules = classificationRules;
    }
}