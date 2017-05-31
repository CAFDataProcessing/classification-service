## CAF_9039 - Classification Service UpdateTermList - negative tests ##

Verify that the UpdateTermList service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateTermList call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateTermList call returns the expected error codes and the database is not updated and the TermList remains unchanged

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


