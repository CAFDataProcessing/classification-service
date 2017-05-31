## CAF_9019 - Classification Service CreateClassification TermList - negative tests ##

Verify that the CreateClassification TermList service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an CreateClassification TermList call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The CreateClassification TermList call returns the expected error codes and the database is not updated with the new Classification TermList

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


