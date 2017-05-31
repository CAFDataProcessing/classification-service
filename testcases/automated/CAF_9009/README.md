## CAF_9009 - Classification Service DeleteClassificationRule - negative tests ##

Verify that the DeleteClassificationRule service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteClassificationRule call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteClassificationRule call returns the expected error codes and the database is not updated as the Classification Rule should still be present

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


