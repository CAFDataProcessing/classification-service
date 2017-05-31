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
package com.github.cafdataprocessing.classification.service.creation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Resolves classification IDs from names
 */
public class ClassificationNameResolver {
    private static final Logger LOGGER = LoggerFactory.getLogger(ClassificationNameResolver.class);
    private final Map<String, Long> classificationNamesToIds = new LinkedHashMap<>();

    /**
     * Adds the provided map of entries to the existing map of names to IDs.
     * @param newClassificationNamesToIds Map of entries that should be added.
     */
    public void populateFromMap(Map<String, Long> newClassificationNamesToIds){
        classificationNamesToIds.putAll(newClassificationNamesToIds);
    }

    /**
     * Adds the provided name and ID value to the map of names to IDs.
     * @param classificationName Name to use as key in map.
     * @param classificationId ID of classification that will be used as value of the provided name.
     */
    public void addNameAndId(String classificationName, Long classificationId){
        classificationNamesToIds.put(classificationName, classificationId);
    }

    /**
     * Takes a classification name and returns the classification ID if it is known.
     * @param classificationName Name of classification to return ID for.
     * @return The matching ID of the classification name or null if no match known.
     */
    public Long resolveNameToId(String classificationName){
        if(!classificationNamesToIds.containsKey(classificationName)){
            return null;
        }
        return classificationNamesToIds.get(classificationName);
    }
}