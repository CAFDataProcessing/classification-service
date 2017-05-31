## CAF_9081 - Classification Service UpdateRuleClassifications - negative tests ##

Verify that the UpdateRuleClassifications service call returns correct error codes when invalid information is provided

**Test Steps**

Using the Classification service perform an UpdateRuleClassifications call, entering invalid information and then check the Classification database

**Test Data**

N/A

**Expected Result**

The UpdateRuleClassification call returns the expected error codes and the database is not updated with the new Rule Classification

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)




