## CAF_9073 - Classification Service DeleteRuleClassification - negative tests ##

Verify that the DeleteRuleClassification service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteRuleClassification call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteRuleClassification call returns the expected error codes and the database is not updated as the Rule Classification should still be present

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


