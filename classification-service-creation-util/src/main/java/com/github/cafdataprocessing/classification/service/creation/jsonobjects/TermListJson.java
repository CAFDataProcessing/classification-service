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
import com.github.cafdataprocessing.classification.service.client.model.BaseTermList;

import java.util.ArrayList;
import java.util.List;

/**
 * JSON representation of a classification service term list
 */
public class TermListJson {
    public final String name;
    public final String description;
    public final List<TermJson> terms;

    public TermListJson(@JsonProperty(value= "name", required = true)String name,
                         @JsonProperty(value= "description")String description,
                        @JsonProperty(value = "terms")List<TermJson> terms){
        this.name = name;
        this.description = description;
        this.terms = terms == null ? new ArrayList<>() : terms;
    }

    public BaseTermList toApiTermList(){
        BaseTermList termList = new BaseTermList();
        termList.setName(this.name);
        termList.setDescription(this.description);
        return termList;
    }
}
