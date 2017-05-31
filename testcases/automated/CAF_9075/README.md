## CAF_9075 - Classification Service DeleteRuleClassifications - negative tests ##

Verify that the DeleteRuleClassifications service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an DeleteRuleClassifications call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The DeleteRuleClassifications call returns the expected error codes and the database is not updated as the Rule Classifications should still be present

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)


