## CAF_9069 - Classification Service UpdateClassificationRuleCondition - negative tests ##

Verify that the UpdateClassificationRuleCondition service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateClassificationRuleCondition call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateClassificationRuleCondition call returns the expected error codes and the database is not updated with the new Classification Rule Condition

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


