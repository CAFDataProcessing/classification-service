/*
 * Copyright 2015-2017 Hewlett Packard Enterprise Development LP.
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
//class to hold string related manipulation functions

module.exports = {
  getString: getString
};

//takes in an object and returns the appropriate string representation
function getString(input){
  if(input instanceof Error){
    return input;
  }
  if(Array.isArray(input)){
    return a.toString();
  }
  var inputType = typeof(input);
  if(inputType==='object'){
    return JSON.stringify(input);
  }
  return input.toString();
}