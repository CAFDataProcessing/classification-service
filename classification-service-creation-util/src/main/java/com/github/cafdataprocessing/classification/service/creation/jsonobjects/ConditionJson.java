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
import com.github.cafdataprocessing.classification.service.client.model.Condition;
import com.github.cafdataprocessing.classification.service.creation.TermListNameResolver;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.ConditionAdditionalJson;

/**
 * JSON representation of a classification service condition
 */
public class ConditionJson {

    public String name;
    public ConditionAdditionalJson additional;

    public ConditionJson(@JsonProperty(value= "name")String name,
                              @JsonProperty(value= "additional", required = true)ConditionAdditionalJson additional){
        this.name = name;
        this.additional = additional;
    }

    public Condition toApiCondition(TermListNameResolver termNameResolver){
        Condition condition = new Condition();
        condition.setName(this.name);
        condition.setAdditional(TermListNameResolver.updateTermListConditionNamesToIds(this.additional, termNameResolver));
        return condition;
    }


}
