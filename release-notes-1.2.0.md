!not-ready-for-release!

#### Version Number
${version-number}

#### New Features
- [CAF-3295](https://jira.autonomy.com/browse/CAF-3295): Added functionality to creation utility to remove existing entities before creating a new workflow.
    Default behaviour when calling create is now to check for the existance of workflows, classifications and term lists that match the entities that are to be created and delete them. This is enabled by default but can be overridden via parameter passed to the create call.

#### Known Issues
