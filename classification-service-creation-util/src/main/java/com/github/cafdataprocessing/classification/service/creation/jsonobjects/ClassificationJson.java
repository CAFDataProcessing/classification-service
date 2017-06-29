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
package com.github.cafdataprocessing.classification.service.creation.jsonobjects;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.cafdataprocessing.classification.service.client.model.BaseClassification;
import com.github.cafdataprocessing.classification.service.creation.TermListNameResolver;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.ConditionAdditionalJson;

/**
 * JSON representation of a classification service classification
 */
public class ClassificationJson {
    public String name;
    public String description;
    public String type;
    public ConditionAdditionalJson additional;
    public BaseClassification.ClassificationTargetEnum classification_target;

    public ClassificationJson(@JsonProperty(value= "name")String name,
                              @JsonProperty(value= "description")String description,
                              @JsonProperty(value= "type")String type,
                         @JsonProperty(value= "additional", required = true)ConditionAdditionalJson additional,
                              @JsonProperty(value= "classification_target")BaseClassification.ClassificationTargetEnum classification_target){
        this.name = name;
        this.description = description;
        this.type = type;
        this.additional = additional;
        this.classification_target = classification_target;
    }

    public BaseClassification toApiBaseClassification(TermListNameResolver termListNameResolver){
        BaseClassification classification = new BaseClassification();
        classification.setName(this.name);
        classification.setDescription(this.description);
        classification.setType(this.type);
        classification.setAdditional(TermListNameResolver.updateTermListConditionNamesToIds(this.additional, termListNameResolver));
        if(this.classification_target!=null) {
            classification.setClassificationTarget(this.classification_target);
        }
        return classification;
    }
}
