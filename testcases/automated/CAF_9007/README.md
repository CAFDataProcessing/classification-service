## CAF_9007 - Classification Service CreateClassificationRule - negative tests ##

Verify that the CreateClassificationRule service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an CreateClassificationRule call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The CreateClassificationRule call returns the expected error codes and the database is not updated with the new Classification Rule

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


