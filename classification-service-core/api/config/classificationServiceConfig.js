/*
 * Copyright 2015-2017 EntIT Software LLC, a Micro Focus company.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//config for the classification service
var logger = require('../logging/logging.js');

//environment variables that config will be pulled from
var classificationServicePort = "CAF_CLASSIFICATION_SERVICE_PORT";

var classificationServiceConfig = {
  port: 8080
};

//Get API Port
var portEnv = process.env[classificationServicePort];
if(portEnv!==null && portEnv!==undefined){
  classificationServiceConfig.port = portEnv;
}
module.exports = classificationServiceConfig;
logger.debug(function(){return "Service config is: "+JSON.stringify(classificationServiceConfig);});