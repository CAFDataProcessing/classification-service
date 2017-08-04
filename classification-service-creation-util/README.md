# classification-service-creation-util

## Summary

This library can be used to create a classification workflow based on a provided JSON representation. A contactable classification web service is required as the utility will submit create requests through this API.

## Usage

The main entry point for the library is the WorkflowCreator class. Exposed methods allow for either a Java File object or the location of a file to be passed along with a project ID. A JSON definition of the workflow to create is then deserialized from the file.

Default behaviour for creation is to check for the existence of workflows, classifications and term lists under the specified project ID that use the same names as those objects to be created. Any existing matches are removed. This is to facilitate clean-up in the event of failure during previous creation efforts. This behaviour can be disabled by passing the parameter to control this overwrite behaviour when calling the initialization code in WorkflowCreator.

## JSON Format

The format for the JSON input file is described [here](./Classification_JSON.md). An example of the expected format for the JSON file can be seen in the 'examples' folder [here](./examples/example_workflow.json). Classifications and term lists can be defined alongside a workflow in the JSON and referenced using their name rather than an ID (as the ID would not be known before initialization begins).