## CAF_9005 - Classification Service CreateClassificationRuleCondition - negative tests ##

Verify that the CreateClassificationRuleCondition service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an CreateClassificationRuleCondition call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The CreateClassificationRuleCondition call returns the expected error codes and the database is not updated with the new Classification Rule Condition

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)

