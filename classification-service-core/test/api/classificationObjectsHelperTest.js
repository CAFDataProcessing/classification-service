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
//unit tests for classificationObjectsHelper.js
var assert = require("../helpers/assertHelper.js");
var sinon = require("sinon");
var classificationObjectsHelper = require("../../api/helpers/classificationObjectsHelper.js").classifications;

//resolves timeout issue when using sinon.test
sinon.config = {
  useFakeTimers: false
};

describe('helpers - classificationObjectsHelper', function(){
  describe('getTermListIdsOnClassification', function(){
    describe('Return Term List IDs from a passed in Classification', function(){
      it('Should return the Term List IDs on the child conditions', sinon.test(function(done){
          var termListIdValue1 = 100;
          var termListIdValue2 = 200;
          var termListIdValue3 = 300;
          var classificationExample = {
            "name": "Classification Test",
            "description": "A description Classification created 20/09/2016",
            "type": "default",
            "additional": {
              "type": "boolean",
              "operator": "and",
              "children": [
                {
                  "name": "Classification Test",
                  "description": "A description Classification created 20/09/2016",
                  "type": "default",
                  "additional": {
                    "type": "termlist",
                    "field": "CONTENT",
                    "value": termListIdValue1
                  }
                },
                {
                  "name": "Cat Condition",
                  "description": "Condition to find cat.",
                  "additional": {
                    "type": "string",
                    "field": "CONTENT",
                    "value": "cat",
                    "operator": "contains",
                    "notes": "CAT_CONDITION"
                  }
                },
                {
                  "name": "Count Condition",
                  "description": "Checks the count.",
                  "additional": {
                    "type": "boolean",
                    "operator": "and",
                    "children": [
                      {
                        "name": "Classification Test",
                        "description": "A description Classification created 20/09/2016",
                        "type": "default",
                        "additional": {
                          "type": "termlist",
                          "field": "CONTENT",
                          "value": termListIdValue2
                        }
                      },
                      {
                        "name": "Classification Test",
                        "description": "A description Classification created 20/09/2016",
                        "type": "default",
                        "additional": {
                          "type": "termlist",
                          "field": "CONTENT",
                          "value": termListIdValue3
                        }
                      }
                    ]
                  }
                }
              ]
            }
        };
          
        var extractedTermListIds = classificationObjectsHelper.getTermListIdsOnClassification(classificationExample);

        assert(extractedTermListIds.length===3, "Expecting three Term List IDs to have been extracted.");
        assert(extractedTermListIds.indexOf(termListIdValue1)!==-1, "Expected extracted Term List ID: "+termListIdValue1+" & extracted IDs were "+extractedTermListIds);
        assert(extractedTermListIds.indexOf(termListIdValue2)!==-1, "Expected extracted Term List ID: "+termListIdValue2+" & extracted IDs were "+extractedTermListIds);
        assert(extractedTermListIds.indexOf(termListIdValue3)!==-1, "Expected extracted Term List ID: "+termListIdValue3+" & extracted IDs were "+extractedTermListIds);
      
        done();
      }));
      it('Should return the Term List ID on the condition', sinon.test(function(done){
          var termListIdValue = 300;
          var classificationExample = {
              "name": "Classification Test",
              "description": "A description Classification created 20/09/2016",
              "type": "default",
              "additional": {
                "type": "termlist",
                "field": "CONTENT",
                "value": termListIdValue
            }
          };
          var extractedTermListIds = classificationObjectsHelper.getTermListIdsOnClassification(classificationExample);
          assert(extractedTermListIds.length===1, "Expecting one Term List ID to have been extracted.");
          assert.equal(extractedTermListIds[0], termListIdValue);          
        done();
      }));
    });
  });
});