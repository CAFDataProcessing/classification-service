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

import com.github.cafdataprocessing.classification.service.client.model.BooleanConditionAdditional;
import com.github.cafdataprocessing.classification.service.client.model.Condition;
import com.github.cafdataprocessing.classification.service.client.model.ConditionCommon;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.BooleanConditionAdditionalJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.ConditionJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.NotConditionAdditionalJson;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.conditions.TermListConditionAdditionalJson;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Tests to verify that conditions formed from JSON can be converted to appropriate classification service representation.
 * Particularly that their additional property is converted to the appropriate type
 */
public class ConditionJsonTest {

    @Test
    public void notTermListConditionWithName(){
        Long termId = ThreadLocalRandom.current().nextLong(Long.MAX_VALUE);
        String termName = "term name - "+UUID.randomUUID().toString();
        ConditionJson origTermListCondition = buildTermListConditionJson(termName);

        TermListNameResolver resolver = buildTermListNameResolver(termName, termId);

        NotConditionAdditionalJson notAdditional = new NotConditionAdditionalJson();
        notAdditional.type = ConditionCommon.TypeEnum.NOT.toString();
        notAdditional.condition = origTermListCondition;
        ConditionJson origNotCondition = new ConditionJson("not", notAdditional);

        Condition apiCondition = origNotCondition.toApiCondition(resolver);
        Object apiAdditionalObj = apiCondition.getAdditional();
        if(!(apiAdditionalObj instanceof NotConditionAdditionalJson)){
            Assert.fail("Converted not condition additional is not expected type. Is: "
                    +apiAdditionalObj.getClass().toGenericString());
        }
        NotConditionAdditionalJson apiAdditionalNot = (NotConditionAdditionalJson) apiAdditionalObj;
        ConditionJson negatedApiCondition = apiAdditionalNot.condition;
        Object negatedApiAdditionalObj = negatedApiCondition.additional;
        if(!(negatedApiAdditionalObj instanceof TermListConditionAdditionalJson)){
            Assert.fail("Converted not condition 'condition' additional property is not a term list type. Is: "
                    +negatedApiAdditionalObj.getClass().toGenericString());
        }
        TermListConditionAdditionalJson negatedAdditional = (TermListConditionAdditionalJson) negatedApiAdditionalObj;
        compareTermListJsonAdditional((TermListConditionAdditionalJson) origTermListCondition.additional,
                negatedAdditional, resolver);
    }

    @Test
    public void booleanTermListConditionWithName(){
        Long termId = ThreadLocalRandom.current().nextLong(Long.MAX_VALUE);
        String termName = "term name - "+UUID.randomUUID().toString();
        ConditionJson origTermListCondition = buildTermListConditionJson(termName);

        TermListNameResolver resolver = buildTermListNameResolver(termName, termId);

        BooleanConditionAdditionalJson booleanAdditional = new BooleanConditionAdditionalJson();
        booleanAdditional.children = new ArrayList<>();
        booleanAdditional.children.add(origTermListCondition);
        booleanAdditional.type = ConditionCommon.TypeEnum.BOOLEAN.toString();
        booleanAdditional.operator = BooleanConditionAdditional.OperatorEnum.AND.toString();
        ConditionJson origBooleanCondition = new ConditionJson("boolean", booleanAdditional);

        Condition apiCondition = origBooleanCondition.toApiCondition(resolver);
        Object apiAdditionalObj = apiCondition.getAdditional();
        if(!(apiAdditionalObj instanceof BooleanConditionAdditionalJson)){
            Assert.fail("Converted boolean condition additional is not expected type. Is: "
                    +apiAdditionalObj.getClass().toGenericString());
        }
        BooleanConditionAdditionalJson apiAdditionalBool = (BooleanConditionAdditionalJson) apiAdditionalObj;
        List<ConditionJson> apiChildren = apiAdditionalBool.children;
        Assert.assertEquals(apiChildren.size(), 1, "Expecting boolean api condition to have one child.");
        ConditionJson childCondition = apiChildren.get(0);
        Object childAdditionalObj = childCondition.additional;
        if(!(childAdditionalObj instanceof TermListConditionAdditionalJson)){
            Assert.fail("Converted boolean condition child's additional property is not a term list type. Is: "
                    +childAdditionalObj.getClass().toGenericString());
        }
        TermListConditionAdditionalJson childAdditional =
                (TermListConditionAdditionalJson) childAdditionalObj;
        compareTermListJsonAdditional((TermListConditionAdditionalJson) origTermListCondition.additional,
                childAdditional, resolver);
    }

    @Test
    public void termListConditionWithName(){
        Long termId = ThreadLocalRandom.current().nextLong(Long.MAX_VALUE);
        String termName = "term name - "+UUID.randomUUID().toString();
        ConditionJson conditionToTest = buildTermListConditionJson(termName);

        TermListNameResolver resolver = buildTermListNameResolver(termName, termId);

        Condition apiCondition = conditionToTest.toApiCondition(resolver);
        Object apiAdditionalObj = apiCondition.getAdditional();
        if(!(apiAdditionalObj instanceof TermListConditionAdditionalJson)){
            Assert.fail("Additional object on the converted condition is not of expected type. Is: "
                    + apiAdditionalObj.getClass().toGenericString());
        }
        TermListConditionAdditionalJson apiAdditional = (TermListConditionAdditionalJson) apiAdditionalObj;
        compareTermListJsonAdditional((TermListConditionAdditionalJson) conditionToTest.additional, apiAdditional, resolver);
    }

    private TermListNameResolver buildTermListNameResolver(String termName, Long termId){
        TermListNameResolver resolver = new TermListNameResolver();
        Map<String, Long> namesToIds = new LinkedHashMap<>();
        namesToIds.put(termName, termId);
        resolver.populateFromMap(namesToIds);
        return resolver;
    }

    private ConditionJson buildTermListConditionJson(String termName){
        String conditionName = "condition name - "+ UUID.randomUUID().toString();
        String termField = "term field - "+UUID.randomUUID().toString();
        TermListConditionAdditionalJson originalAdditional = new TermListConditionAdditionalJson();
        originalAdditional.field = termField;
        originalAdditional.value = termName;
        originalAdditional.type = ConditionCommon.TypeEnum.TERMLIST.toString();
        return new ConditionJson(conditionName, originalAdditional);
    }

    private void compareTermListJsonAdditional(TermListConditionAdditionalJson expected,
                                               TermListConditionAdditionalJson received,
                                               TermListNameResolver resolver){
        Assert.assertEquals(received.field, expected.field, "Field on received additional for condition is not as expected.");
        if(resolver==null){
            Assert.assertEquals(received.value, expected.value,
                    "Value on received additional for condition should match expected value.");;
            return;
        }
        //check if term list name resolver has an appropriate ID for the term list condition
        Long expectedId = resolver.resolveNameToId(expected.value);
        Assert.assertEquals(received.value, expectedId.toString(),
                "Value on received additional condition should be the term list name resolved to an ID.");
    }
}
