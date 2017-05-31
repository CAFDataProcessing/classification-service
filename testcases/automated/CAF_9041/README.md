## CAF_9041 - Classification Service DeleteTerm - negative tests ##

Verify that the DeleteTerm service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteTerm call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteTerm call returns the expected error codes and the database is not updated as the Term should still be present

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


