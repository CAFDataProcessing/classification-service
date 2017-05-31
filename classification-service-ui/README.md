# classification-service-ui

The Classification UI allows users to see what operations the web service exposes as well as documentation relating to those operations and the web service in general.

This Swagger UI project generates the branded Swagger documentation web page against the latest Classification API contract and copies the built UI to the Classification web service UI folder.

Note that currently updating the contract in the application does not update the UI that had been previously built and it is necesary to rerun the 'package' maven goal against the project to update the UI.

## Usage

The UI created reachable via a deployed Classification API Service at 
```
http://<service.ip.address>:<port>/classification-ui
```

Replace \<service.ip.address\> and \<port\> as necessary.