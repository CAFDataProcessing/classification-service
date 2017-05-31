# Objects Model
## Overview
The classification service maps Policy API objects it receives to its own object model and converts requests a caller makes from the Classification model into the model that Policy API expects. The Classification objects and their counterpart Policy API mappings are outlined here.

## Workflow

### Classification Service

A Workflow in the Classification Service is composed of the following properties;

| Name | Type |  Description|
| ---------- | ----- |  ------ |
| id | number | The identifier for the Workflow |
| name | string | The name of the Workflow |
| description | string | A description giving context as to the purpose of the Workflow. |
| notes | string | Can be used to record additional information about the Workflow that may not be suitable for display in the Description. |

### Policy API

The Classification Service 'Workflow' maps to the following structure in Policy API.

#### Workflow 
The Type 'sequence_workflow' in Policy API.

| Name |  Classification Service Property |
| ---------- | ------ | 
| id | id | 
| name | name | 
| notes | notes |

## Classification

### Classification Service

A Classification in the Classification Service is composed of the following properties;

| Name | Type | Description | Example |
| ---------- | -----  | ------ | ------ |
| id | number | The identifier for the Classification | 100 |
| name | string | The name of the Classification | Travel Documents |
| description | string | A description giving context as to the purpose of the Classification. | A Classification to match Travel Documents such as booking confirmations, itineraries etc. |
| type | string | Can be used to record additional information about the Classification not suitable for Description or Name. | DEFAULT_CLASSIFICATION |
| additional | JSON Object | Describes the options set for this Classification appropriate to its type. See the condition type definitions in Policy API for properties that can be set on this object. | *See "'Additional' Property" section example. |

### Policy API

The Classification Service 'Classification' is represented via the following structures in Policy API.

#### Condition

| Name |  Classification Service Property | Example |
| ---------- | ------ | ------ | 
| id | N/A | 50
| name | N/A | CLASSIFICATION_POLICY_ID:100 (*see section "Link between Condition and Policy") |
| additional | additional | *See section "'Additional' Property" |

The Condition component is used in the Policy API to determine if a Document should be considered a match.

#### Policy
| Name |  Classification Service Properties | Example |
| ---------- | ------ | ------ | 
| id | id | 100 |
| name | N/A | CLASSIFICATION_CONDITION_ID:50 (*see section "Link between Condition and Policy") |
| description | name , description & type | * See "Policy 'description' Example" |

The Policy component is executed by the Policy API when a Document is considered a match (when Condition and Policy are set on a Collection). The ID of the Policy executed is returned in the Result from the Policy API and can be used to refer back to the Classification in the Classification Service API.

e.g. A Document submitted to the Classification Worker application may return a result;
```
{
  "classifiedDocuments" : [
    "reference": "Test Document.docx",
    "resolvedPolicies": [1]
  ]  
}
```
The ID in 'resolvedPolicies' can then be used to identify the Classification object that was matched.

##### Policy 'description' Example
The 'name', 'description' and 'type' provided by the caller are stored in the 'description' property of the Policy associated with the Classification as a JSON object.


```
{  
    "name": "Travel Documents",
    "description": "A Classification to match Travel Documents such as booking confirmations, itineraries etc.",
    "type": "DEFAULT_CLASSIFICATION"
}
```

##### Link between Condition and Policy
The reason for 'name' being stored in the JSON Object on 'description' of a Policy is that the Condition and Policy created for a Classification must share the same 'name' so that they can be associated. This value used for association is not editable by caller as it should not need to change over time so the 'name' that caller can edit is moved to inside the JSON object of 'description'. The Classification API will create the Condition and Policy, then update both so that their name refers to the ID of the other.

##### 'Additional' Property
This property is used to specify the criteria that makes up the Classification and supports the same structure as 'additional' on Conditions in the Policy API.

###### Example
``` 
{
  "type": "boolean",
  "operator": "and",
  "children": [
    {
      "name": "Cat Condition",
      "additional": {
        "type": "string",
        "order": 100,
        "field": "CONTENT",
        "value": "cat",
        "operator": "contains",
        "notes": "CAT_CONDITION"
      }
    },
    {
      "name": "Count Condition",
      "additional": {
        "type": "number",
        "order": 200,
        "field": "COUNT",
        "value": 2,
        "operator": "eq"
      }
    }
  ]
} 
```

This example passed as 'additional' on a Classification would cause the Classification to only match those Documents whose 'CONTENT' field contains the value 'cat' and that have a 'COUNT' field equal to '2'. Note that conditions created under 'children' may omit the "type" set to "boolean" property required by Policy API as the Classification Service will add this automatically.

###### Using a Term List on a Classification

The Classification Service also allows specifying "termlist" type Conditions, which are renamed 'lexicon' type Conditions from Policy API and support the same options. The Service will change any Conditions specified as 'termlist' to 'lexicon' when sending to Policy API and the inverse when returning results from Policy API to Classification Service. The Classification Service can be used to create Term Lists and the IDs of those Term Lists can then be passed when creating a Classification as a Condition.

###### Example
```
"additional": {
    	"type": "termlist",
    	"field": "CONTENT",
    	"value": 30
  }
```
The Term List could also have been specified as a child Condition as with the other supported types.