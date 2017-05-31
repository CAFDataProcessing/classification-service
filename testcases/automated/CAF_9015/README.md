## CAF_9015 - Classification Service UpdateClassificationRule - negative tests ##

Verify that the UpdateClassificationRule service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateClassificationRule call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateClassificationRule call returns the expected error codes and the database is not updated and the Classification Rule remains unchanged

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


