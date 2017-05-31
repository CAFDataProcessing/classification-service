## CAF_9051 - Classification Service UpdateTerms - negative tests ##

Verify that the UpdateTerms service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateTerms call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateTerms call returns the expected error codes and the database is not updated and the Terms remain unchanged

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


