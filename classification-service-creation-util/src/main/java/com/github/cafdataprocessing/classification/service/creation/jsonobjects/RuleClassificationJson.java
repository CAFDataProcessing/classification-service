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
import com.fasterxml.jackson.databind.JsonMappingException;
import com.github.cafdataprocessing.classification.service.client.model.BaseRuleClassification;
import com.github.cafdataprocessing.classification.service.creation.StringUtils;
import com.github.cafdataprocessing.classification.service.creation.ClassificationNameResolver;

/**
 * JSON representation of a classification service rule classification
 */
public class RuleClassificationJson {
    public final String classificationName;
    public final Long classificationId;

    public RuleClassificationJson(@JsonProperty(value= "classificationName")String classificationName,
                                  @JsonProperty(value= "classificationId")Long classificationId){
        if(classificationId == null && StringUtils.isNullOrEmpty(classificationName)){
            throw new RuntimeException(new JsonMappingException(
                    "'classificationName' or 'classificationId' property must be set on rule classification. Neither currently set."));
        }

        this.classificationName = classificationName;
        this.classificationId = classificationId;
    }

    public BaseRuleClassification toApiRuleClassification(ClassificationNameResolver classificationNameResolver){
        BaseRuleClassification ruleClassification = new BaseRuleClassification();
        if(classificationId!=null) {
            ruleClassification.setClassificationId(classificationId);
            return ruleClassification;
        }
        //try to match the classification name to known classifications provided
        Long classificationId = classificationNameResolver.resolveNameToId(this.classificationName);
        ruleClassification.setClassificationId(classificationId);
        return ruleClassification;
    }
}
