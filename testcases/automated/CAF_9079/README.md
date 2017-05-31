## CAF_9079 - Classification Service GetRuleClassifications - negative tests ##

Verify that the GetRuleClassifications service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an GetRuleClassifications call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The GetRuleClassifications call returns the expected error codes

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)

**Actual Result**

If you pass an Rule ID that does not exist on a Workflow the error message returned is:

"message": "Classification ID: 12 not found on Workflow with ID: 1"

Note that the message states that the classification ID cannot be found when it is in fact the Rule ID that cannot be found.


