## CAF_9031 - Classification Service CreateTermList - negative tests ##

Verify that the CreateTermList service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an CreateTermList call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The CreateTermList call returns the expected error codes and the database is not updated with the new TermList

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


