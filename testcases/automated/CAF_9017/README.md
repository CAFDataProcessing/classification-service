## CAF_9017 - Classification Service CreateClassification - negative tests ##

Verify that the CreateClassification service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an CreateClassification call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The CreateClassification call returns the expected error codes and the database is not updated with the new Classification

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


