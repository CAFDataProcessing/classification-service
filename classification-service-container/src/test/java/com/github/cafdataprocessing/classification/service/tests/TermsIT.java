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

import com.github.cafdataprocessing.classification.service.tests.utils.ApiClientProvider;
import com.github.cafdataprocessing.classification.service.client.ApiException;
import com.github.cafdataprocessing.classification.service.client.api.TermsApi;
import com.github.cafdataprocessing.classification.service.client.model.*;
import org.testng.Assert;
import org.testng.annotations.*;

import java.util.*;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Classification Service Integration tests for Terms and Term Lists.
 */
public class TermsIT {
    private static TermsApi termsApi;

    private String projectId;

    @BeforeClass
    public static void setup() throws Exception {
        termsApi = new TermsApi(ApiClientProvider.getApiClient());
    }

    /**
     * Before every test generate a new project ID to avoid results from previous tests affecting subsequent tests.
     */
    @BeforeMethod
    public void intializeProjectId(){
        projectId = UUID.randomUUID().toString();
    }

    @Test(description = "Creates a term list with 3 terms and verifies that the term lists and terms can be retrieved as expected. Then adds an additional term.. Then adds one terms with overwrite set to true.")
    public void createTermListWithTerms() throws ApiException {
        //test data values
        String termListToCreateName = "termList_" + UUID.randomUUID().toString();
        String termListToCreateDescription = "termList_description_" + UUID.randomUUID().toString();

        BaseTermList termListToCreate = new BaseTermList();
        termListToCreate.setName(termListToCreateName);
        termListToCreate.setDescription(termListToCreateDescription);

        ExistingTermList termListCreated = termsApi.createTermList(projectId, termListToCreate);
        Long termListCreatedId = termListCreated.getId();
        //use the ID of the term list returned to try and retrieve the created term list and verify its properties
        ExistingTermList termListRetrieved = termsApi.getTermList(projectId, termListCreatedId);

        compareTermList(termListToCreate, termListRetrieved);

        //verify that there are no existing terms on the term list
        ExistingTerms existingTerms = termsApi.getTerms(projectId, termListCreatedId, 1, 10);
        Assert.assertEquals((int) existingTerms.getTotalHits(), 0,
                "Total hits for the terms on the list should be 0 initially.");
        Assert.assertTrue(existingTerms.getTerms().isEmpty(), "There should be no terms on the term list initially.");

        //add some terms to the term list
        String term1Expression = "\"Flight  Purchase Confirmation\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term1Type = BaseTerm.TypeEnum.TEXT;
        BaseTerm termToCreate_1 = new BaseTerm();
        termToCreate_1.setExpression(term1Expression);
        termToCreate_1.setType(term1Type);

        String term2Expression = "\"Test Flight  Itinerary\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term2Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_2 = new BaseTerm();
        termToCreate_2.setExpression(term2Expression);
        termToCreate_2.setType(term2Type);

        String term3Expression = "\"Another expression\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term3Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_3 = new BaseTerm();
        termToCreate_3.setExpression(term3Expression);
        termToCreate_3.setType(term3Type);

        List<BaseTerm> termsToAddList = Arrays.asList(termToCreate_1, termToCreate_2, termToCreate_3);
        int termsToAddListSize = termsToAddList.size();
        {
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(termsToAddList);

            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);

            //retrieve the terms to verify that they were added as expected. Retrieve in pages to verify that works as expected.

            int termsPageSize = 2;
            ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, termsPageSize);
            Assert.assertEquals((int) retrievedTerms.getTotalHits(), termsToAddListSize,
                    "Total Hits should be the amount of terms passed in the update call previously.");

            Assert.assertEquals(retrievedTerms.getTerms().size(), termsPageSize,
                    "Should have got a number of results returned equal to page size.");

            //create another list that we can remove terms from as we find them
            LinkedList<BaseTerm> termsToFind = new LinkedList<>(termsToAddList);

            //terms not necessarily returned in order we passed them, check the terms returned against those intended to create.
            checkTermsReturned(retrievedTerms, termsToFind);
            Assert.assertEquals(termsToFind.size(), 1, "There should only be one term left to find as other terms should have been returned by the first page request.");

            //issue another request to get the remaining term
            retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 2, termsPageSize);
            Assert.assertEquals((int) retrievedTerms.getTotalHits(), termsToAddListSize,
                    "Total Hits should be the amount of terms passed in the update call previously.");

            Assert.assertEquals(retrievedTerms.getTerms().size(), 1, "Should have got a single term returned.");

            //the term returned should be a match for the remaining term
            ExistingTerm remainingTerm = retrievedTerms.getTerms().get(0);
            BaseTerm expectedTerm = termsToFind.get(0);
            compareTerm(expectedTerm, remainingTerm);
        }

        //add an additional term (overwrite false)
        String term4Expression = "\"Added term expression\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term4Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_4 = new BaseTerm();
        termToCreate_4.setExpression(term4Expression);
        termToCreate_4.setType(term4Type);

        {
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(Arrays.asList(termToCreate_4));
            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);

            //verify that this term was added and other terms were unmodified
            //create another list that we can remove terms from as we find them
            LinkedList<BaseTerm> termsToFind = new LinkedList<>(Arrays.asList(termToCreate_1, termToCreate_2, termToCreate_3, termToCreate_4));
            ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, termsToFind.size());
            Assert.assertEquals((int) retrievedTerms.getTotalHits(), termsToFind.size(),
                    "Total Hits should be the number of terms added so far.");

            Assert.assertEquals(retrievedTerms.getTerms().size(), termsToFind.size(),
                    "Should have got a number of results equal to number of terms added so far.");

            //terms not necessarily returned in order we passed them, check the terms returned against those intended to create.
            checkTermsReturned(retrievedTerms, termsToFind);
            Assert.assertEquals(termsToFind.size(), 0, "All terms should have been found on the page request, both old and new.");
        }
        //now add a term with overwrite property set to true, this should clear other terms and cause only the passed term to be returned on retrieves
        String term5Expression = "\"Overwrite term expression\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term5Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_5 = new BaseTerm();
        termToCreate_5.setExpression(term5Expression);
        termToCreate_5.setType(term5Type);

        {
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(Arrays.asList(termToCreate_5));
            termsToAdd.setOverwrite(true);
            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);

            //verify that this term was added and other terms were removed
            //create another list that we can remove terms from as we find them
            LinkedList<BaseTerm> termsToFind = new LinkedList<>(Arrays.asList(termToCreate_5));
            ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, 5);
            Assert.assertEquals((int) retrievedTerms.getTotalHits(), termsToFind.size(),
                    "Total Hits should be only the last term added due to overwrite.");

            Assert.assertEquals(retrievedTerms.getTerms().size(), termsToFind.size(),
                    "Should have got one result back due to the overwrite.");

            //check the term returned against the one we expect it to be
            compareTerm(termToCreate_5, retrievedTerms.getTerms().get(0));
        }

    }

    @Test(description = "Creates a term list with 2 terms and then updates the properties of the term list and one of the terms.")
    public void updateTermListAndTerm() throws ApiException {
        //test data values
        String termListToCreateName = "termList_" + UUID.randomUUID().toString();
        String termListToCreateDescription = "termList_description_" + UUID.randomUUID().toString();

        BaseTermList termListToCreate = new BaseTermList();
        termListToCreate.setName(termListToCreateName);
        termListToCreate.setDescription(termListToCreateDescription);

        ExistingTermList termListCreated = termsApi.createTermList(projectId, termListToCreate);
        Long termListCreatedId = termListCreated.getId();
        //use the ID of the term list returned to try and retrieve the created term list and verify its properties
        ExistingTermList termListRetrieved = termsApi.getTermList(projectId, termListCreatedId);
        compareTermList(termListToCreate, termListRetrieved);

        //add some terms to the term list
        String term1Expression = "\"Flight  Purchase Confirmation\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term1Type = BaseTerm.TypeEnum.TEXT;
        BaseTerm termToCreate_1 = new BaseTerm();
        termToCreate_1.setExpression(term1Expression);
        termToCreate_1.setType(term1Type);

        String term2Expression = "\"Test Flight  Itinerary\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term2Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_2 = new BaseTerm();
        termToCreate_2.setExpression(term2Expression);
        termToCreate_2.setType(term2Type);

        {
            List<BaseTerm> termsToAddList = Arrays.asList(termToCreate_1, termToCreate_2);
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(termsToAddList);
            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);
        }

        //update the name & description on the term list
        String updatedTermListName = "Updated \"name_\""+ UUID.randomUUID().toString();
        String updatedTermListDescription = "\"Updated description\""+ UUID.randomUUID().toString();
        termListToCreate.setName(updatedTermListName);
        termListToCreate.setDescription(updatedTermListDescription);
        termsApi.updateTermList(projectId, termListCreatedId, termListToCreate);

        //retrieve the term list and check that only the name was updated
        ExistingTermList updatedTermList = termsApi.getTermList(projectId, termListCreatedId);
        compareTermList(termListToCreate, updatedTermList);

        ExistingTerms termsOnTermList = termsApi.getTerms(projectId, termListCreatedId, 1, 100);
        //check that the terms on the term list were unaffected
        {
            Assert.assertEquals((int) termsOnTermList.getTotalHits(), 2, "Terms total hits should be two on the term list.");
            Assert.assertEquals(termsOnTermList.getTerms().size(), 2, "Should be two terms on the term list.");
            LinkedList<BaseTerm> termsToFind = new LinkedList<>(Arrays.asList(termToCreate_1, termToCreate_2));
            checkTermsReturned(termsOnTermList, termsToFind);
        }

        //update a specific term
        ExistingTerm termToUpdate = termsOnTermList.getTerms().get(0);
        String updatedTermExpresion = "Updated term expression "+UUID.randomUUID();
        BaseTerm.TypeEnum updatedTermType = termToUpdate.getType() == BaseTerm.TypeEnum.TEXT ? BaseTerm.TypeEnum.REGEX : BaseTerm.TypeEnum.TEXT;
        BaseTerm updatedTerm = new BaseTerm();
        updatedTerm.setExpression(updatedTermExpresion);
        updatedTerm.setType(updatedTermType);

        {
            termsApi.updateTerm(projectId, termListCreatedId, termToUpdate.getId(), updatedTerm);
            //check that terms are as expected on the term list
            termsOnTermList = termsApi.getTerms(projectId, termListCreatedId, 1, 100);
            Assert.assertEquals((int) termsOnTermList.getTotalHits(), 2, "Terms total hits should be two on the term list.");
            Assert.assertEquals(termsOnTermList.getTerms().size(), 2, "Should be two terms on the term list.");
            LinkedList<BaseTerm> termsToFind = new LinkedList<>(Arrays.asList(updatedTerm, termToCreate_2, termToCreate_1));
            checkTermsReturned(termsOnTermList, termsToFind);
            Assert.assertEquals(termsToFind.size(), 1, "Should have failed to find the original version of one of the terms but found the others specified.");

            String unfoundTermExpression = termsToFind.get(0).getExpression();
            Assert.assertNotEquals(unfoundTermExpression, updatedTermExpresion, "The term that was not found should not have an expression matching the updated term details (it should be the original form of whichever term was updated).");
            Assert.assertTrue(unfoundTermExpression.equals(term1Expression) || unfoundTermExpression.equals(term2Expression),
                    "The expression on the term that was not found should match one of the original expressions set.");
        }

        //verify that trying to update a term list that doesn't exist fails
        try{
            termsApi.updateTermList(projectId, ThreadLocalRandom.current().nextLong(), updatedTermList);
            Assert.fail("Expected an exception to be thrown trying to update a term list that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find Term List"),
                    "Expected message to state term list could not be found. Message: "+e.getMessage());
        }

        //verify that trying to update a term that doesn't exist fails
        try{
            termsApi.updateTerm(projectId, termListCreatedId, ThreadLocalRandom.current().nextLong(), updatedTerm);
            Assert.fail("Expected an exception to be thrown trying to update a term that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find Term with"),
                    "Expected message to state term could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates a term list and then creates another.")
    public void createTermLists() throws ApiException {
        BaseTermList termList_1 = new BaseTermList();
        termList_1.setDescription("test"+UUID.randomUUID().toString());
        termList_1.setName("test_1"+UUID.randomUUID().toString());

        ExistingTermList createdTermList = termsApi.createTermList(projectId, termList_1);
        //check that the term list returned from the call is as expected
        compareTermList(termList_1, createdTermList);

        //create another term list
        BaseTermList termList_2 = new BaseTermList();
        termList_2.setDescription("test 2 description"+UUID.randomUUID().toString());
        termList_2.setName("test_2"+UUID.randomUUID().toString());
        createdTermList = termsApi.createTermList(projectId, termList_2);
        compareTermList(termList_2, createdTermList);
    }

    @Test(description = "Creates term lists and then deletes a term list.")
    public void deleteTermList() throws ApiException {
        BaseTermList termList_1 = new BaseTermList();
        termList_1.setDescription("test"+UUID.randomUUID().toString());
        termList_1.setName("test_1"+UUID.randomUUID().toString());

        ExistingTermList createdTermList_1 = termsApi.createTermList(projectId, termList_1);
        //check that the term list returned from the call is as expected
        compareTermList(termList_1, createdTermList_1);

        //create another term list
        BaseTermList termList_2 = new BaseTermList();
        termList_2.setDescription("test 2 description"+UUID.randomUUID().toString());
        termList_2.setName("test_2"+UUID.randomUUID().toString());
        ExistingTermList createdTermList_2 = termsApi.createTermList(projectId, termList_2);
        compareTermList(termList_2, createdTermList_2);

        //delete the first term list
        termsApi.deleteTermList(projectId, createdTermList_1.getId());

        //verify that term list no longer present
        ExistingTermLists existingTermLists = termsApi.getTermLists(projectId, 1, 100);
        Assert.assertEquals((int) existingTermLists.getTotalHits(), 1, "Total Hits should report only one term list remaining after delete.");
        Assert.assertEquals(existingTermLists.getTermLists().size(), 1, "Should only be one term list returned after delete.");

        ExistingTermList remainingTermList = existingTermLists.getTermLists().get(0);
        //verify that this is the term list we expect to still be here
        compareTermList(termList_2, remainingTermList);
        Assert.assertEquals(remainingTermList.getId(), createdTermList_2.getId(), "Expecting ID of reamining term list to be that of the second term list created.");

        //try to retrieve the first term list, should cause an error to be returned
        try{
            termsApi.getTermList(projectId, createdTermList_1.getId());
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find Term List with ID: "+createdTermList_1.getId()));
        }
    }

    @Test(description = "Creates multiple term lists and verifies that all of them are returned from multiple page requests.")
    public void getTermLists() throws ApiException {
        int numberOfTermListsToCreate = 21;
        List<ExistingTermList> termListsToFind = new LinkedList<>();
        for(int numberOfTermListsCreated = 0; numberOfTermListsCreated < numberOfTermListsToCreate; numberOfTermListsCreated++){
            //create a term list
            BaseTermList newTermList = new BaseTermList();
            newTermList.setName("Name_" + UUID.randomUUID().toString());
            newTermList.setDescription("Description_"+UUID.randomUUID().toString());
            ExistingTermList createdTermList = termsApi.createTermList(projectId, newTermList);
            termListsToFind.add(createdTermList);
        }
        //page through term lists, should find all of them by the time the end is reached
        int pageSize = 5;
        int pageNum = 1;
        int termListsSoFarCount = 0;
        while(true) {
            ExistingTermLists getTermListsResult = termsApi.getTermLists(projectId, pageNum, pageSize);
            List<ExistingTermList> retrievedTermLists = getTermListsResult.getTermLists();
            Assert.assertEquals((int) getTermListsResult.getTotalHits(), numberOfTermListsToCreate, "Total hits should report the expected number of term lists.");

            if(pageNum*pageSize <= numberOfTermListsToCreate){
                //until we get to the page that includes the last result (or go beyond the number available) there should always be 'pageSize' number of results returned
                Assert.assertEquals(retrievedTermLists.size(), pageSize, "Expecting full page of term list results.");
            }
            //remove returned term lists from the list of term lists to find
            checkTermListsReturned(getTermListsResult, termListsToFind);

            //increment page num so that call to get term lists retrieves the next page of results
            pageNum++;

            termListsSoFarCount += getTermListsResult.getTermLists().size();
            if(termListsSoFarCount>numberOfTermListsToCreate){
                Assert.fail("More term lists encountered than expected.");
            }
            if(termListsSoFarCount==numberOfTermListsToCreate){
                Assert.assertTrue(termListsToFind.isEmpty(), "After encountering the expected number of term lists there should be no more term lists that we are searching for.");
                break;
            }
        }
        //send a final get request and verify that nothing is returned.
        ExistingTermLists expectedEmptyGetResult = termsApi.getTermLists(projectId, pageNum, pageSize);

        Assert.assertEquals((int) expectedEmptyGetResult.getTotalHits(), numberOfTermListsToCreate, "Total hits should report the expected number of term lists even on a page outside range of results.");
        Assert.assertTrue(expectedEmptyGetResult.getTermLists().isEmpty(), "Should be no term lists returned for page request outside expected range.");
    }

    @Test(description = "Create term lists and verify they can be retrieved correctly.")
    public void getTermList() throws ApiException {
        BaseTermList termList_1 = new BaseTermList();
        termList_1.setDescription("test"+UUID.randomUUID().toString());
        termList_1.setName("test_1"+UUID.randomUUID().toString());

        ExistingTermList createdTermList_1 = termsApi.createTermList(projectId, termList_1);
        //check that the term list returned from the call is as expected
        compareTermList(termList_1, createdTermList_1);

        //create another term list
        BaseTermList termList_2 = new BaseTermList();
        termList_2.setDescription("test 2 description"+UUID.randomUUID().toString());
        termList_2.setName("test_2"+UUID.randomUUID().toString());
        ExistingTermList createdTermList_2 = termsApi.createTermList(projectId, termList_2);
        compareTermList(termList_2, createdTermList_2);

        //get each term list and verify their properties are as expected
        ExistingTermList retrievedTermList_1 = termsApi.getTermList(projectId, createdTermList_1.getId());
        compareTermList(termList_1, retrievedTermList_1);
        Assert.assertEquals(retrievedTermList_1.getId(), createdTermList_1.getId(), "ID of returned term list should be the ID passed to get call.");

        ExistingTermList retrievedTermList_2 = termsApi.getTermList(projectId, createdTermList_2.getId());
        compareTermList(termList_2, retrievedTermList_2);
        Assert.assertEquals(retrievedTermList_2.getId(), createdTermList_2.getId(), "ID of returned term list should be the ID passed to get call.");

    }

    @Test(description = "Creates a term list with some terms then deletes a term and verifies it is no longer in the system.")
    public void deleteTerm() throws ApiException {
        BaseTermList termList_1 = new BaseTermList();
        termList_1.setDescription("test"+UUID.randomUUID().toString());
        termList_1.setName("test_1"+UUID.randomUUID().toString());

        ExistingTermList createdTermList_1 = termsApi.createTermList(projectId, termList_1);
        Long termListCreatedId = createdTermList_1.getId();

        //add some terms to the term list
        String term1Expression = "\"Flight  Purchase Confirmation\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term1Type = BaseTerm.TypeEnum.TEXT;
        BaseTerm termToCreate_1 = new BaseTerm();
        termToCreate_1.setExpression(term1Expression);
        termToCreate_1.setType(term1Type);

        String term2Expression = "\"Test Flight  Itinerary\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term2Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_2 = new BaseTerm();
        termToCreate_2.setExpression(term2Expression);
        termToCreate_2.setType(term2Type);

        String term3Expression = "\"Another expression\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term3Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_3 = new BaseTerm();
        termToCreate_3.setExpression(term3Expression);
        termToCreate_3.setType(term3Type);

        List<BaseTerm> termsToAddList = Arrays.asList(termToCreate_1, termToCreate_2, termToCreate_3);
        {
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(termsToAddList);
            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);
        }
        //get a term with its ID so it can be deleted
        ExistingTerm termToDelete;
        LinkedList<BaseTerm> termsToFind = new LinkedList<BaseTerm>();
        {
            ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, 3);
            termToDelete = retrievedTerms.getTerms().get(0);
            termsToFind.add(retrievedTerms.getTerms().get(1));
            termsToFind.add(retrievedTerms.getTerms().get(2));
        }
        termsApi.deleteTerm(projectId, termListCreatedId, termToDelete.getId());

        //retrieve terms on the term list and verify the deleted term is not there and that the other terms are
        ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, 10);
        Assert.assertEquals((int) retrievedTerms.getTotalHits(), 2, "Expecting only two terms to remain after delete.");
        checkTermsReturned(retrievedTerms, termsToFind);

        //verify that trying to delete a term that doesn't exist fails
        try{
            termsApi.deleteTerm(projectId, termListCreatedId, ThreadLocalRandom.current().nextLong());
            Assert.fail("Expected an exception to be thrown trying to delete a term that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find Term with ID"),
                    "Expected message to state term could not be found. Message: "+e.getMessage());
        }
    }

    @Test(description = "Creates term list with some terms, then delete some of the terms.")
    public void deleteTerms() throws ApiException {
        BaseTermList termList_1 = new BaseTermList();
        termList_1.setDescription("test"+UUID.randomUUID().toString());
        termList_1.setName("test_1"+UUID.randomUUID().toString());

        ExistingTermList createdTermList_1 = termsApi.createTermList(projectId, termList_1);
        Long termListCreatedId = createdTermList_1.getId();

        //add some terms to the term list
        String term1Expression = "\"Flight  Purchase Confirmation\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term1Type = BaseTerm.TypeEnum.TEXT;
        BaseTerm termToCreate_1 = new BaseTerm();
        termToCreate_1.setExpression(term1Expression);
        termToCreate_1.setType(term1Type);

        String term2Expression = "\"Test Flight  Itinerary\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term2Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_2 = new BaseTerm();
        termToCreate_2.setExpression(term2Expression);
        termToCreate_2.setType(term2Type);

        String term3Expression = "\"Another expression\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term3Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_3 = new BaseTerm();
        termToCreate_3.setExpression(term3Expression);
        termToCreate_3.setType(term3Type);

        List<BaseTerm> termsToAddList = Arrays.asList(termToCreate_1, termToCreate_2, termToCreate_3);
        {
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(termsToAddList);
            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);
        }

        //get two terms with their IDs so they can be deleted
        List<Long> idsToDelete = new LinkedList<>();
        Long expectedTermId;
        LinkedList<BaseTerm> termsToFind = new LinkedList<>();
        {
            ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, 3);
            idsToDelete.add(retrievedTerms.getTerms().get(0).getId());
            idsToDelete.add(retrievedTerms.getTerms().get(1).getId());
            ExistingTerm termThatShouldRemain = retrievedTerms.getTerms().get(2);
            termsToFind.add(termThatShouldRemain);
            expectedTermId = termThatShouldRemain.getId();
        }

        //verify that trying to delete terms that don't exist fails
        try{
            List<Long> invalidIdsToDelete = new LinkedList<>();
            invalidIdsToDelete.add(ThreadLocalRandom.current().nextLong());
            invalidIdsToDelete.add(ThreadLocalRandom.current().nextLong());
            TermIds invalidTermIdsToDelete = new TermIds();
            invalidTermIdsToDelete.setTermIds(invalidIdsToDelete);
            termsApi.deleteTerms(projectId, termListCreatedId, invalidTermIdsToDelete);
            Assert.fail("Expected an exception to be thrown trying to delete a term that doesn't exist.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("IDs specified not found on Term List"),
                    "Expected message to state term could not be found. Message: "+e.getMessage());
        }

        TermIds termIdsToDelete = new TermIds();
        termIdsToDelete.setTermIds(idsToDelete);
        termsApi.deleteTerms(projectId, termListCreatedId, termIdsToDelete);

        //retrieve the term that should still be there
        ExistingTerm remainingTerm = termsApi.getTerm(projectId, termListCreatedId, expectedTermId);
        compareTerm(termsToFind.get(0), remainingTerm);

        //try to retrieve the individual terms that were deleted
        try{
            termsApi.getTerm(projectId, termListCreatedId, idsToDelete.get(0));
            Assert.fail("Expecting exception to be thrown when trying to retrieve a term that should have been deleted.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find Term with ID"), "Expecting message returned to convey inability to find delete term.");
        }
        try{
            termsApi.getTerm(projectId, termListCreatedId, idsToDelete.get(1));
            Assert.fail("Expecting exception to be thrown when trying to retrieve a term that should have been deleted.");
        }
        catch(ApiException e){
            Assert.assertTrue(e.getMessage().contains("Unable to find Term with ID"), "Expecting message returned to convey inability to find delete term.");
        }

        //retrieve terms on the term list and verify the deleted terms are not there and that the leftover term is
        ExistingTerms retrievedTerms = termsApi.getTerms(projectId, termListCreatedId, 1, 10);
        Assert.assertEquals((int) retrievedTerms.getTotalHits(), 1, "Expecting only one term to remain after delete.");
        checkTermsReturned(retrievedTerms, termsToFind);
    }

    @Test(description = "Creates term list with some terms, then delete all of the terms.")
    public void deleteAllTerms() throws ApiException {
        BaseTermList termList_1 = new BaseTermList();
        termList_1.setDescription("test"+UUID.randomUUID().toString());
        termList_1.setName("test_1"+UUID.randomUUID().toString());

        ExistingTermList createdTermList_1 = termsApi.createTermList(projectId, termList_1);
        Long termListCreatedId = createdTermList_1.getId();

        //add some terms to the term list
        String term1Expression = "\"Flight  Purchase Confirmation\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term1Type = BaseTerm.TypeEnum.TEXT;
        BaseTerm termToCreate_1 = new BaseTerm();
        termToCreate_1.setExpression(term1Expression);
        termToCreate_1.setType(term1Type);

        String term2Expression = "\"Test Flight  Itinerary\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term2Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_2 = new BaseTerm();
        termToCreate_2.setExpression(term2Expression);
        termToCreate_2.setType(term2Type);

        String term3Expression = "\"Another expression\"" + UUID.randomUUID().toString();
        BaseTerm.TypeEnum term3Type = BaseTerm.TypeEnum.REGEX;
        BaseTerm termToCreate_3 = new BaseTerm();
        termToCreate_3.setExpression(term3Expression);
        termToCreate_3.setType(term3Type);

        List<BaseTerm> termsToAddList = Arrays.asList(termToCreate_1, termToCreate_2, termToCreate_3);
        {
            NewTerms termsToAdd = new NewTerms();
            termsToAdd.setTerms(termsToAddList);
            termsApi.updateTerms(projectId, termListCreatedId, termsToAdd);
        }

        //pass ids to delete as empty to cause all terms to be deleted
        List<Long> idsToDelete = new LinkedList<>();
        TermIds termIdsToDelete = new TermIds();
        termIdsToDelete.setTermIds(idsToDelete);
        termsApi.deleteTerms(projectId, termListCreatedId, termIdsToDelete);

        //retrieve terms on the term list and verify the deleted terms are not there and that the leftover term is
        ExistingTerms retrievedTermsResult = termsApi.getTerms(projectId, termListCreatedId, 1, 10);
        Assert.assertEquals((int) retrievedTermsResult.getTotalHits(), 0, "Expecting total hits for terms to be 0 after delete.");
        List<ExistingTerm> retrievedTerms = retrievedTermsResult.getTerms();
        Assert.assertTrue(retrievedTerms.isEmpty(), "Expecting no terms to remain after delete.");
    }

    /**
     * Search the retrieved term lists passed for the occurrence of a set of term lists. When a match is found for a term list it is removed from the list of terms to find passed in.
     * @param retrievedTermLists The term lists to search through.
     * @param termListsToFind The term lists to search for.
     */
    private void checkTermListsReturned(ExistingTermLists retrievedTermLists, List<ExistingTermList> termListsToFind){
        for(ExistingTermList retrievedTermList: retrievedTermLists.getTermLists()){
            Optional<ExistingTermList> foundTermList = termListsToFind.stream()
                    .filter(filterTermList -> filterTermList.getId().equals(retrievedTermList.getId())).findFirst();
            if(foundTermList.isPresent()) {
                compareTermList(foundTermList.get(), retrievedTermList);
                //remove from the list of term lists for next check
                termListsToFind.remove(foundTermList.get());
            }
        }
    }

    /**
     * Searches the retrieved terms passed for those matching the terms to find. When a match is found for a term it is removed from the list of terms to find that was passed in.
     * @param retrievedTerms The terms to search through.
     * @param termsToFind The terms to search for.
     */
    private void checkTermsReturned(ExistingTerms retrievedTerms, List<BaseTerm> termsToFind){
        //terms not necessarily returned in order we passed them, check the terms returned against those intended to create.
        for (ExistingTerm retrievedTerm : retrievedTerms.getTerms()) {
            Optional<BaseTerm> termPassedToUpdate = termsToFind.stream()
                    .filter(filterTerm -> filterTerm.getExpression().equals(retrievedTerm.getExpression())).findFirst();
            if (termPassedToUpdate.isPresent()) {
                compareTerm(termPassedToUpdate.get(), retrievedTerm);
                //remove from the list of terms for next check
                termsToFind.remove(termPassedToUpdate.get());
            }
        }
    }

    /**
     * Compares two terms to ensure their relevant properties match using Asserts.
     * @param expectedTerm The term in the form is was when passed to update.
     * @param returnedTerm The term returned after update performed.
     */
    private void compareTerm(BaseTerm expectedTerm, ExistingTerm returnedTerm){
        Assert.assertEquals(returnedTerm.getExpression(), expectedTerm.getExpression(),
                "Term expressions should be the same.");
        Assert.assertEquals(returnedTerm.getType(), expectedTerm.getType(), "Term types should be the same.");
    }

    /**
     * Compares two term lists to ensure their relevant properties match using Asserts.
     * @param expectedTermList The term list with expected properties.
     * @param returnedTermList The term list that was returned that should be compared.
     */
    private void compareTermList(BaseTermList expectedTermList, ExistingTermList returnedTermList){
        Assert.assertEquals(returnedTermList.getName(), expectedTermList.getName(),
                "Name returned for term list should be the expected value.");
        Assert.assertEquals(returnedTermList.getDescription(), expectedTermList.getDescription(),
                "Description return for term list should be the expected value.");
    }
}
