## CAF_9033 - Classification Service DeleteTermList - negative tests ##

Verify that the DeleteTermList service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteTermList call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteTermList call returns the expected error codes and the database is not updated as the TermList should still be present.

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


