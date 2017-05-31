## CAF_9029 - Classification Service UpdateClassification TermList - negative tests ##

Verify that the UpdateClassification TermList service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateClassification TermList call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateClassification TermList call returns the expected error codes and the database is not updated and the Classification remains unchanged

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


