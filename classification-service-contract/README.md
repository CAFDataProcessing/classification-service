# classification-service-contract

This project packages the classification-service swagger contract used in the service into a jar file that can be retrieved as an artifact through Maven for use by other projects e.g. a service calling library, a UI generated from the contract.

The generated contract can be added as a dependency as shown below;

```
<dependency>
    <groupId>com.github.cafdataprocessing</groupId>
    <artifactId>classification-service-contract</artifactId>
    <version>${version}</version>
</dependency>
```

+ The '${version}' should be replaced with the appropriate version of the packaged contract to use.