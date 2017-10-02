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

/**
 * Information for a classification rule that was created
 */
public class CreatedRuleClassification{
    private long id;
    private long classificationId;

    /**
     * Parameterless constructor to support JSON deserialization.
     */
    public CreatedRuleClassification(){}

    public CreatedRuleClassification(long id, long classificationId) {
        this.id = id;
        this.classificationId = classificationId;
    }

    public long getClassificationId(){
        return classificationId;
    }

    public void setClassificationId(long classificationId){
        this.classificationId = classificationId;
    }

    public long getId(){
        return id;
    }

    public void setId(long id){
        this.id = id;
    }
}
