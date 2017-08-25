#### Version Number
${version-number}

#### New Features

#### Bug Fixes
- [CAF-3352](https://jira.autonomy.com/browse/CAF-3352): Not condition children underneath Not conditions could not be edited.
  When a Not condition was created with `condition` set to another Not condition it was not possible to edit the next level of conditions being negated. This has been fixed to allow Rule Condition API calls to retrieve conditions at all levels in the Not chain.
- [CAF-3328](https://jira.autonomy.com/browse/CAF-3328): Updating a classification rule cleared the set rule classifications.
  Fixed an issue in the update logic for a classification rule in the classification API where the child rule classifications were lost following an update request.

#### Known Issues
