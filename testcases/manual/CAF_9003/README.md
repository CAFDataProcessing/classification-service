## CAF_9003 - Classification Service - Health Check ##

Verify that the Classification service Health Check works as expected

**Test Steps**

1. Set up system and deploy the Classification service container 
2. Call the web service health check using the url: http://(hostInfo):(hostPort)/classification/v1/healthCheck

**Test Data**

N/A

**Expected Result**

The service will return a status of 200 and a boolean value of "true"

**JIRA Link** - [CAF-1293](https://jira.autonomy.com/browse/CAF-1293)
