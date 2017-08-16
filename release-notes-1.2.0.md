!not-ready-for-release!

#### Version Number
${version-number}

#### New Features
- [CAF-3295](https://jira.autonomy.com/browse/CAF-3295): Added functionality to creation utility to remove existing entities before creating a new workflow.
    Default behaviour when calling create is now to check for the existance of workflows, classifications and term lists that match the entities that are to be created and delete them. This is enabled by default but can be overridden via parameter passed to the create call.

#### Bug Fixes
- [CAF-3352](https://jira.autonomy.com/browse/CAF-3352): The negated condition on Not rule condition could not be edited.
  When rule conditions of type Boolean are created the IDs of their children are returned and they can be updated, retrieved and deleted. Attempting to perform operations on the condition that was negated in a Not condition returned an error message. Fix has been applied to bring Not conditions in line with Boolean conditions allowing edits of the negated condition directly. This means that either the entire Not condition can be used in rule condition operations or just the negated condition (varying the ID appropriately).
    
#### Known Issues
