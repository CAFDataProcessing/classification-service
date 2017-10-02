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
package com.github.cafdataprocessing.classification.service.creation.created;

import java.util.ArrayList;
import java.util.List;

/**
 * Information for a classification rule that was created
 */
public class CreatedClassificationRule extends CreatedApiObject {
    private List<CreatedApiObject> ruleConditions = new ArrayList<>();
    private List<CreatedRuleClassification> ruleClassifications = new ArrayList<>();

    /**
     * Parameterless constructor to support JSON deserialization.
     */
    public CreatedClassificationRule(){
        super();
    }

    public CreatedClassificationRule(long id, String name) {
        super(id, name);
    }

    public void addRuleCondition(CreatedApiObject ruleCondition){
        this.ruleConditions.add(ruleCondition);
    }

    public List<CreatedApiObject> getRuleConditions(){
        return ruleConditions;
    }

    public void addRuleClassification(CreatedRuleClassification ruleClassification){
        this.ruleClassifications.add(ruleClassification);
    }

    public List<CreatedRuleClassification> getRuleClassifications(){
        return ruleClassifications;
    }
}