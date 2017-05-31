## CAF_9001 - Classification Policy Type supports passing Workflow ID ##

Verify that it is possible to send a Workflow ID to Classification Policies

**Test Steps**

1. Setup a system with Policy Worker, Policy UI, Policy Admin, Classification Worker, Classification UI and Classification Admin
- When deploying Classification UI ensure you set the enableWorkflow property to "true"
- Also ensure that projectId is the same for both policy and classification
2. On the Classification UI, create a Workflow with a collection sequence, collection with catch all condition and an Indexing Policy set to no index
3. On the Policy UI create a Workflow that sends a document to be classified (using the classification Policy on a collection)
- When creating the classification Policy only specify the queueName (set to the input queue of the classification worker) and 'workflowId', set to the id of the workflow created on the classification system
- Add another collection sequence to this workflow that outputs the document to a queue (using generic queue policy and collection set to catch all)
4. Send a message to the Policy Worker input queue specifying the ID of the Workflow created
5. Check the message that appears on the output queue

**Test Data**

Any document

**Expected Result**

The Document goes into Policy Worker, matches the external classification collection and executes the Policy to send to the classification Worker, saying which workflow to execute on that system.
The classification Worker should then evaluate the Document against the collections on that workflow and return to Policy Worker saying which collections, conditions and Policy were matched.
In the taskData of the output message will contain the POLICY_MATCHED_POLICYNAME and POLICY_MATCHED_POLICYID which indicates that the correct Workflow was followed

**JIRA Link** - [CAF-936](https://jira.autonomy.com/browse/CAF-936)
