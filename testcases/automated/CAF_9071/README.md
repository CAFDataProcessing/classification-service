## CAF_9071 - Classification Service CreateRuleClassification - negative tests ##

Verify that the CreateRuleClassification service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an CreateRuleClassification call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The CreateRuleClassification call returns the expected error codes and the database is not updated with the new Classification Rule Condition

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


