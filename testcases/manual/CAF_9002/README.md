## CAF_9002 - Classification Policy Type supports passing Collection Sequence ID ##

Verify that it is possible to send a Collection Sequence ID to Classification Policies

**Test Steps**

1. Setup a system with Policy Worker, Policy UI, Policy Admin, Classification Worker, Classification UI and Classification Admin
- When deploying Classification UI ensure you set the enableWorkflow property to "true"
- Also ensure that projectId is the same for both policy and classification
2. On the Classification UI, create a Collection Sequence, collection with catch all condition and an Indexing Policy set to no index
3. On the Policy UI create a Collection Sequence that sends a document to be classified (using the classification Policy on a collection)
- When creating the Classification Policy only specify the queueName (set to the input queue of the classification worker) and 'classificationSequenceId', set to the id of the collection sequence created on the classification system
4. Send a message to the Policy Worker input queue specifying the ID of the Collection Sequence created
5. Check the message that appears on the output queue

**Test Data**

Any document

**Expected Result**

The Document goes into Policy Worker, matches the external classification collection and executes the Policy to send to the classification Worker, saying which workflow to execute on that system.
The classification Worker should then evaluate the Document against the collections on that workflow and return to Policy Worker saying which collections, conditions and Policy were matched.
In the taskData of the output message will contain the POLICY_MATCHED_COLLECTION, POLICY_MATCHED_POLICYNAME and POLICY_MATCHED_POLICYID which indicates that the correct Collection Sequence was followed

**JIRA Link** - [CAF-955](https://jira.autonomy.com/browse/CAF-955)
