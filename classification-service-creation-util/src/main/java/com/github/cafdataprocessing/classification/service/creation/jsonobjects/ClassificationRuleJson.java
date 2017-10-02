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
import com.github.cafdataprocessing.classification.service.client.model.BaseClassificationRule;

import java.util.ArrayList;
import java.util.List;

/**
 * JSON representation of a data processing classification rule
 */
public class ClassificationRuleJson {
    public final String name;
    public final String description;
    public final Integer priority;
    public final List<RuleClassificationJson> ruleClassifications;
    public final List<ConditionJson> ruleConditions;

    public ClassificationRuleJson(@JsonProperty(value= "name", required = true)String name,
                              @JsonProperty(value= "description")String description,
                              @JsonProperty(value= "enabled")Boolean enabled,
                              @JsonProperty(value= "priority")Integer priority,
                              @JsonProperty(value= "ruleClassifications")List<RuleClassificationJson> ruleClassifications,
                              @JsonProperty(value= "ruleConditions")List<ConditionJson> ruleConditions){
        this.name = name;
        this.description = description;
        this.priority = priority;
        this.ruleClassifications = ruleClassifications == null ? new ArrayList<>() : ruleClassifications;
        this.ruleConditions = ruleConditions == null ? new ArrayList<>() : ruleConditions;
    }

    public BaseClassificationRule toApiBaseClassificationRule(){
        BaseClassificationRule rule = new BaseClassificationRule();
        rule.setName(this.name);
        rule.setDescription(this.description);
        rule.setPriority(priority);
        return rule;
    }
}
