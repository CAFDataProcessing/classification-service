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
package com.github.cafdataprocessing.classification.service.tests;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cafdataprocessing.classification.service.tests.utils.AdditionalPropertyComparison;
import com.github.cafdataprocessing.classification.service.tests.utils.ApiClientProvider;
import com.github.cafdataprocessing.classification.service.tests.utils.ObjectsInitializer;
import com.github.cafdataprocessing.classification.service.client.ApiClient;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.ClassificationsApi;
import com.github.cafdataprocessing.classification.service.client.api.TermsApi;
import com.github.cafdataprocessing.classification.service.client.model.*;
import com.github.cafdataprocessing.classification.service.client.model.Condition;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

import static com.github.cafdataprocessing.classification.service.client.model.ConditionCommon.TypeEnum.*;

/**
 * Integration tests for Classifications API paths in the Classification Service.
 */
public class ClassificationsIT {
    private static ObjectMapper mapper = new ObjectMapper();

    private static ClassificationsApi classificationsApi;
    private static TermsApi termsApi;
    private String projectId;

    @BeforeClass
    public static void setup() throws Exception {
        ApiClient apiClient = ApiClientProvider.getApiClient();
        classificationsApi = new ClassificationsApi(apiClient);
        termsApi = new TermsApi(apiClient);
        //setting this to false so that even conditions with their IDs can be converted to appropriate additional type.
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Before every test generate a new project ID to avoid results from previous tests affecting subsequent tests.
     */
    @BeforeMethod
    public void intializeProjectId(){
        projectId = UUID.randomUUID().toString();
    }

    @Test(description = "Creates some classifications then retrieves them as pages.")
    public void getClassifications() throws ApiException {
        int numberOfClassificationsToCreate = 26;
        List<ExistingClassification> createdClassifications = new LinkedList<>();

        for(int createdClassificationsCounter = 0; createdClassificationsCounter < numberOfClassificationsToCreate;
                createdClassificationsCounter++) {
            BaseClassification classificationToCreate = ObjectsInitializer.initializeClassification();
            ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
            classificationToCreate.setAdditional(existsConditionAdditional);

            createdClassifications.add(createAndRetrieveClassification(classificationToCreate));
        }
        //page through the classifications
        int pageSize = 5;
        int pageNum = 1;
        int classificationsSoFarCount = 0;
        while(true){
            ExistingClassifications classificationsPage = classificationsApi.getClassifications(projectId, pageNum, pageSize);
            Assert.assertEquals((int)classificationsPage.getTotalHits(),
                    numberOfClassificationsToCreate, "Total hits should be the same as the expected number of classifications.");
            List<ExistingClassification> retrievedClassifications = classificationsPage.getClassifications();

            if(pageNum*pageSize <= numberOfClassificationsToCreate){
                //until we get to the page that includes the last result (or go beyond the number available) there should always be 'pageSize' number of results returned
                Assert.assertEquals(retrievedClassifications.size(), pageSize, "Expecting full page of classification results.");
            }
            //remove returned classifications from list of classifications to find
            checkClassificationsReturned(classificationsPage, createdClassifications);
            //increment page num so that next call retrieves next page
            pageNum++;
            classificationsSoFarCount += retrievedClassifications.size();
            if(classificationsSoFarCount > numberOfClassificationsToCreate){
                Assert.fail("More classifications encountered than expected.");
            }
            else if(classificationsSoFarCount == numberOfClassificationsToCreate){
                Assert.assertTrue(createdClassifications.isEmpty(), "After encountering the expected number of classifications there should be no more classifications that we are searching for.");
                break;
            }
        }
        //send a final get request and verify that nothing is returned.
        ExistingClassifications expectedEmptyGetResult = classificationsApi.getClassifications(projectId,
                pageNum, pageSize);

        Assert.assertEquals((int) expectedEmptyGetResult.getTotalHits(), numberOfClassificationsToCreate,
                "Total hits should report the expected number of classifications even on a page outside range of results.");
        Assert.assertTrue(expectedEmptyGetResult.getClassifications().isEmpty(),
                "Should be no classifications returned for page request outside expected range.");

    }

    @Test(description = "Creates some classifications and then deletes one of them.")
    public void deleteClassification() throws ApiException {
        BaseClassification classificationToCreate = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classificationToCreate.setAdditional(existsConditionAdditional);
        ExistingClassification createdClassification_1 = createAndRetrieveClassification(classificationToCreate);

        classificationToCreate = ObjectsInitializer.initializeClassification();
        existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classificationToCreate.setAdditional(existsConditionAdditional);
        ExistingClassification createdClassification_2 = createAndRetrieveClassification(classificationToCreate);

        classificationsApi.deleteClassification(projectId, createdClassification_1.getId());

        ExistingClassifications classificationsPage = classificationsApi.getClassifications(projectId, 1, 100);
        Assert.assertEquals((int)classificationsPage.getTotalHits(), 1,
                "Total Hits should be one after deleting a classification.");
        Assert.assertEquals(classificationsPage.getClassifications().size(), 1,
                "One classification should be returned in the results.");

        ExistingClassification remainingClassification = classificationsPage.getClassifications().get(0);
        compareClassifications(createdClassification_2, remainingClassification);

        Assert.assertEquals(remainingClassification.getId(), createdClassification_2.getId(),
                "ID of remaining classification should be the second classification that was created.");
        try{
            classificationsApi.getClassification(projectId, createdClassification_1.getId());
            Assert.fail("Expecting exception to be thrown when trying to retrieve deleted classification.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to retrieve Classification"),
                    "Exception message should contain expected message about not finding classification.");
        }

        //verify that trying to delete a classification that doesn't exist fails
        try{
            classificationsApi.deleteClassification(projectId, ThreadLocalRandom.current().nextLong());
            Assert.fail("Expected an exception to be thrown trying to delete a classification that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to retrieve Classification with ID"),
                    "Expected message to state classification could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates classification with a string condition, retrieves it and updates it.")
    public void createGetAndUpdateStringClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        StringConditionAdditional stringConditionAdditional = ObjectsInitializer.initializeStringConditionAdditional();

        classification_1.setAdditional(stringConditionAdditional);

        ExistingClassification createdClassification = classificationsApi.createClassification(projectId, classification_1);
        compareClassifications(classification_1, createdClassification);

        ExistingClassification retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);

        classification_1 = ObjectsInitializer.initializeClassification();
        stringConditionAdditional = ObjectsInitializer.initializeStringConditionAdditional();
        stringConditionAdditional.setOperator(StringConditionAdditional.OperatorEnum.ENDS_WITH);
        stringConditionAdditional.setOrder(200);
        classification_1.setAdditional(stringConditionAdditional);
        classificationsApi.updateClassification(projectId, createdClassification.getId(), classification_1);

        retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);

        //verify that trying to update a classification that doesn't exist fails
        try{
            classificationsApi.updateClassification(projectId, ThreadLocalRandom.current().nextLong(), classification_1);
            Assert.fail("Expected an exception to be thrown trying to update a classification that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to retrieve Classification"),
                    "Expected message to state classification could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates classification with a number condition, retrieves it and updates it.")
    public void createGetAndUpdateNumberClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        NumberConditionAdditional numberConditionAdditional = ObjectsInitializer.initializeNumberConditionAdditional();
        classification_1.setAdditional(numberConditionAdditional);

        ExistingClassification createdClassification = classificationsApi.createClassification(projectId, classification_1);
        compareClassifications(classification_1, createdClassification);

        ExistingClassification retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);

        classification_1 = ObjectsInitializer.initializeClassification();
        numberConditionAdditional = ObjectsInitializer.initializeNumberConditionAdditional();
        numberConditionAdditional.setOperator(NumberConditionAdditional.OperatorEnum.GT);
        numberConditionAdditional.setOrder(200);
        classification_1.setAdditional(numberConditionAdditional);
        classificationsApi.updateClassification(projectId, createdClassification.getId(), classification_1);

        retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);
    }

    @Test(description = "Creates, retrieves and updates a classification with a regex condition.")
    public void createGetAndUpdateRegexClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        RegexConditionAdditional regexConditionAdditional = ObjectsInitializer.initializeRegexConditionAdditional();
        classification_1.setAdditional(regexConditionAdditional);

        ExistingClassification createdClassification = classificationsApi.createClassification(projectId, classification_1);
        compareClassifications(classification_1, createdClassification);

        ExistingClassification retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);

        classification_1 = ObjectsInitializer.initializeClassification();
        regexConditionAdditional = ObjectsInitializer.initializeRegexConditionAdditional();
        classification_1.setAdditional(regexConditionAdditional);
        classificationsApi.updateClassification(projectId, createdClassification.getId(), classification_1);
        retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);
    }

    @Test(description = "Creates classification with a date condition, retrieves it and updates it.")
    public void createGetAndUpdateDateClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        DateConditionAdditional dateConditionAdditional = ObjectsInitializer.initializeDateConditionAdditional();
        classification_1.setAdditional(dateConditionAdditional);

        ExistingClassification createdClassification = classificationsApi.createClassification(projectId, classification_1);
        compareClassifications(classification_1, createdClassification);

        ExistingClassification retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);

        classification_1 = ObjectsInitializer.initializeClassification();
        dateConditionAdditional = ObjectsInitializer.initializeDateConditionAdditional();
        classification_1.setAdditional(dateConditionAdditional);
        classificationsApi.updateClassification(projectId, createdClassification.getId(), classification_1);
        retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classification_1, retrievedClassification);
    }

    @Test(description = "Creates classification with a term list condition and retrieves it.")
    public void createAndGetTermListClassification() throws ApiException{
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();

        //create a term list to reference on the classification
        BaseTermList termListToCreate  = ObjectsInitializer.initializeTermList();
        ExistingTermList termListCreated = termsApi.createTermList(projectId, termListToCreate);
        Long termListCreatedId = termListCreated.getId();

        TermlistConditionAdditional termlistConditionAdditional = ObjectsInitializer.initializeTermListConditionAdditional(termListCreatedId.toString());
        classification_1.setAdditional(termlistConditionAdditional);

        createAndRetrieveClassification(classification_1);
    }

    @Test(description = "Creates classification with a not condition and retrieves it.")
    public void createAndGetNotClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        NotConditionAdditional notConditionAdditional = ObjectsInitializer.initializeNotConditionAdditional(null);
        classification_1.setAdditional(notConditionAdditional);

        createAndRetrieveClassification(classification_1);
    }

    @Test(description = "Creates classification with an exists condition and retrieves it.")
    public void createAndGetExistsClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        ExistsConditionAdditional existsConditionAdditional = ObjectsInitializer.initializeExistsConditionAdditional();
        classification_1.setAdditional(existsConditionAdditional);

        createAndRetrieveClassification(classification_1);
    }

    @Test(description ="Creates a classification with a condition type that is supported but not explicitly modeled in the swagger contract.")
    public void createAndGetTextClassification() throws ApiException {
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        LinkedHashMap<String, Object> textCondition = new LinkedHashMap<>();
        textCondition.put("type", ConditionCommon.TypeEnum.TEXT);
        textCondition.put("order", 100);
        textCondition.put("field", "field_"+UUID.randomUUID().toString());
        textCondition.put("value", "CAT DNEAR4 DOG");
        classification_1.setAdditional(textCondition);

        createAndRetrieveClassification(classification_1);
    }

    @Test(description = "Creates classification with a boolean condition and retrieves it.")
    public void createAndGetBooleanClassification() throws ApiException {
        //boolean condition classification
        BaseClassification classification_1 = ObjectsInitializer.initializeClassification();
        BooleanConditionAdditional booleanConditionAdditional = ObjectsInitializer.initializeBooleanConditionAdditional(null);

        classification_1.setAdditional(booleanConditionAdditional);
        createAndRetrieveClassification(classification_1);
    }

    /**
     * Convenience method to create a given classification, verify the returned created result then retrieve the classification
     * from API directly and compare against original classification.
     * @param classificationToCreate The classification to create.
     * @return The classification that was created.
     * @throws ApiException
     */
    private ExistingClassification createAndRetrieveClassification(BaseClassification classificationToCreate) throws ApiException {
        ExistingClassification createdClassification = classificationsApi.createClassification(projectId, classificationToCreate);
        compareClassifications(classificationToCreate, createdClassification);

        ExistingClassification retrievedClassification = classificationsApi.getClassification(projectId, createdClassification.getId());
        Assert.assertEquals(retrievedClassification.getId(), createdClassification.getId(),
                "ID of retrieved classification should match that requested.");
        compareClassifications(classificationToCreate, retrievedClassification);
        return retrievedClassification;
    }

    private void compareClassifications(BaseClassification expectedClassification, ExistingClassification retrievedClassification){
        Assert.assertEquals(retrievedClassification.getName(), expectedClassification.getName(),
                "Classification name should be as expected.");
        Assert.assertEquals(retrievedClassification.getDescription(), expectedClassification.getDescription(),
                "Classification description should be as expected.");
        Assert.assertEquals(retrievedClassification.getType(), expectedClassification.getType(),
                "Classification type should be as expected.");

        ConditionCommon retrievedAdditional = mapper.convertValue(retrievedClassification.getAdditional(), ConditionCommon.class);
        ConditionCommon expectedAdditional = mapper.convertValue(expectedClassification.getAdditional(), ConditionCommon.class);
        AdditionalPropertyComparison.compareAdditional(expectedAdditional.getType(), retrievedAdditional.getType(), expectedClassification.getAdditional(),
                retrievedClassification.getAdditional());
    }



    /**
     * Search the retrieved classifications passed for the occurrence of a set of classifications.
     * When a match is found for a classification it is removed from the list of classifications to find passed in.
     * @param retrievedClassifications The classifications to search through.
     * @param classificationsToFind The classifications to search for.
     */
    private void checkClassificationsReturned(ExistingClassifications retrievedClassifications,
                                              List<ExistingClassification> classificationsToFind){
        for(ExistingClassification retrievedClassification: retrievedClassifications.getClassifications()){
            Optional<ExistingClassification> foundClassification = classificationsToFind.stream()
                    .filter(filterClassification -> filterClassification.getId().equals(retrievedClassification.getId())).findFirst();
            if(foundClassification.isPresent()) {
                compareClassifications(foundClassification.get(), retrievedClassification);
                //remove from the list of classification for next check
                classificationsToFind.remove(foundClassification.get());
            }
            else{
                Assert.fail("An unexpected classification was returned.");
            }
        }
    }
}
