## CAF_9049 - Classification Service UpdateTerm - negative tests ##

Verify that the UpdateTerm service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateTerm call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateTerm call returns the expected error codes and the database is not updated and the Term remains unchanged

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


