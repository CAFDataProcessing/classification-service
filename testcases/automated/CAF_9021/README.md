## CAF_9021 - Classification Service DeleteClassification - negative tests ##

Verify that the DeleteClassification service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteClassification call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteClassification call returns the expected error codes and the database is not updated as the Classification should still be present

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


