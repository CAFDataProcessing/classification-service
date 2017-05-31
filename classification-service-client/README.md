# classification-service-client

This project is an example of a Java library generated from the classification service contract that facilitates communication with the service. It allows callers to manage elements of the Classification Service e.g. Workflows, Classifications, Classification Rules. It is recommended to generate a custom library for your application so that conflicting dependencies can be easily managed against your consuming application.

## Usage

To use this library in another project, have that project take a dependency on 'classification-service-client'. A Maven example is shown below;

```
<dependency>
  <groupId>com.github.cafdataprocessing</groupId>
  <artifactId>classification-service-client</artifactId>
  <version>${version}</version>
</dependency>
```

+ The '${version}' should be replaced with the appropriate version of the packaged contract to use.