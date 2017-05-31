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

import com.github.cafdataprocessing.classification.service.client.model.ConditionCommon;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.BooleanConditionAdditionalJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.ConditionAdditionalJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.ConditionJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.NotConditionAdditionalJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.TermListConditionAdditionalJson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Resolves term list IDs from names
 */
public class TermListNameResolver {
    private static final Logger LOGGER = LoggerFactory.getLogger(TermListNameResolver.class);
    private final Map<String, Long> termListNamesToIds = new LinkedHashMap<>();

    /**
     * Adds the provided map of entries to the existing map of names to IDs.
     * @param newTermListNamesToIds Map of entries that should be added.
     */
    public void populateFromMap(Map<String, Long> newTermListNamesToIds){
        termListNamesToIds.putAll(newTermListNamesToIds);
    }

    /**
     * Adds the provided name and ID value to the map of names to IDs.
     * @param termListName Name to use as key in map.
     * @param termListId ID of term list that will be used as value of the provided name.
     */
    public void addNameAndId(String termListName, Long termListId){
        termListNamesToIds.put(termListName, termListId);
    }

    /**
     * Takes a term list name and returns the term list ID if it is known.
     * @param termListName Name of term list to return ID for.
     * @return The matching ID of the term list name or null if no match known.
     */
    public Long resolveNameToId(String termListName){
        if(!termListNamesToIds.containsKey(termListName)){
            return null;
        }
        return termListNamesToIds.get(termListName);
    }

    /**
     * To handle term list conditions that specify a term list that doesn't exit at time of JSON being read in,
     // we need to examine the 'additional' property
     // if type is a Boolean Condition then have to look at its children to see if any are Term List Conditions
     //if type is a Not Condition then have to look at the condition property to see if any are Term List Conditions
     //if type is a Term List Condition then check if the value matches any names in the provided list of term names to IDs
     //if no match then leave value unchanged as it may be an ID, API will complain if it isn't a valid ID
     //if match then get the ID and set value to that ID (create a new additional to avoid changing existing one passed in)
     * @param additional
     * @param termListNameResolver
     * @return
     */
    public static ConditionAdditionalJson updateTermListConditionNamesToIds(ConditionAdditionalJson additional,
                                                                             TermListNameResolver termListNameResolver){
        if(termListNameResolver==null){
            return additional;
        }

        ConditionCommon.TypeEnum conditionType = ConditionCommon.TypeEnum.valueOf(additional.type.toUpperCase());
        ConditionAdditionalJson updatedAdditional;
        switch(conditionType){
            case TERMLIST:
            case LEXICON:
                updatedAdditional = resolveTermListAdditionalValue(
                        (TermListConditionAdditionalJson) additional, termListNameResolver);
                return updatedAdditional;
            case NOT:
                updatedAdditional = resolveNotConditionAdditionalValue(
                        (NotConditionAdditionalJson) additional, termListNameResolver);
                return updatedAdditional;
            case BOOLEAN:
                updatedAdditional = resolveBooleanConditionAdditionalValue(
                        (BooleanConditionAdditionalJson) additional, termListNameResolver);
                return updatedAdditional;
            default:
                return additional;
        }
    }

    private static void copyPropertiesFromConditionAdditional(ConditionAdditionalJson source, ConditionAdditionalJson target){
        target.order = source.order;
        target.type = source.type;
        target.notes = source.notes;
    }

    private static ConditionAdditionalJson resolveBooleanConditionAdditionalValue(BooleanConditionAdditionalJson originalAdditional,
                                                                                  TermListNameResolver termListNameResolver){
        List<ConditionJson> updatedChildConditions = new ArrayList<>();
        //child conditions may have term list conditions on them (either directly or nested under Not or Boolean), create updated versions
        //of these conditions
        for(ConditionJson childCondition: originalAdditional.children){
            ConditionAdditionalJson updatedChildAdditional =
                    updateTermListConditionNamesToIds(childCondition.additional, termListNameResolver);
            ConditionJson updatedChildCondition = new ConditionJson(childCondition.name, updatedChildAdditional);
            updatedChildConditions.add(updatedChildCondition);
        }
        BooleanConditionAdditionalJson updatedAdditional = new BooleanConditionAdditionalJson();
        copyPropertiesFromConditionAdditional(originalAdditional, updatedAdditional);
        updatedAdditional.operator = originalAdditional.operator;
        updatedAdditional.children = updatedChildConditions;
        return updatedAdditional;
    }

    private static ConditionAdditionalJson resolveNotConditionAdditionalValue(NotConditionAdditionalJson originalAdditional,
                                                                              TermListNameResolver termListNameResolver){
        //check if the condition on the Not is a Boolean or a Term List type condition, if it is then we may have to
        //replace a term name with a term ID
        ConditionJson conditionToNegate = originalAdditional.condition;
        ConditionAdditionalJson updatedNegatedConditionAdditional =
                updateTermListConditionNamesToIds(conditionToNegate.additional, termListNameResolver);
        NotConditionAdditionalJson updatedNotAdditional = new NotConditionAdditionalJson();
        copyPropertiesFromConditionAdditional(originalAdditional, updatedNotAdditional);
        updatedNotAdditional.condition = new ConditionJson(conditionToNegate.name, updatedNegatedConditionAdditional);
        return updatedNotAdditional;
    }

    private static ConditionAdditionalJson resolveTermListAdditionalValue(TermListConditionAdditionalJson originalAdditional,
                                                                          TermListNameResolver termListNameResolver){
        //create new instance additional object to avoid changing values on original
        TermListConditionAdditionalJson resolvedAdditional = new TermListConditionAdditionalJson();
        copyPropertiesFromConditionAdditional(originalAdditional, resolvedAdditional);
        resolvedAdditional.field = originalAdditional.field;

        Long resolvedTermId = termListNameResolver.resolveNameToId(originalAdditional.value);

        if(resolvedTermId==null){
            LOGGER.warn("Unable to find an ID for term list condition with name: "+originalAdditional.value,
                    " , while converting JSON condition to classification API representation.");
            resolvedAdditional.value = originalAdditional.value;
            return resolvedAdditional;
        }
        resolvedAdditional.value = resolvedTermId.toString();
        return resolvedAdditional;
    }
}
