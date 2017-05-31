## CAF_9043 - Classification Service DeleteTerms - negative tests ##

Verify that the DeleteTerms service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteTerms call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteTerms call returns the expected error codes and the database is not updated as the Terms should still be present

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


