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
//unit tests for policyObjectsHelper.js
var assert = require("../helpers/assertHelper.js");
var sinon = require("sinon");
var lexicons = require("../data/lexicons.js");
var policyObjectsHelper = require("../../api/helpers/policyObjectsHelper.js");

//resolves timeout issue when using sinon.test
sinon.config = {
  useFakeTimers: false
};

describe('helpers - policyObjectsHelper', function(){
  describe('checkLexiconExpressionsIdsOnLexicon', function(){
    describe('Return Expression IDs not on Lexicon', function(){
      it('Should return the expected IDs that are not found on the Lexicon as Lexicon Expressions', sinon.test(function(done){
        var lexiconToTest = lexicons.getAverageLexicon();
        var expressions = [55, 66, 34, 64, 61, 98];
        //taking a copy of array in case implementation alters object passed in
        var expectedNotFound = [55, 34, 98];
        var notFound = policyObjectsHelper.checkLexiconExpressionsIdsOnLexicon(lexiconToTest, expressions);
        
        assert(notFound.length === expectedNotFound.length, "Should return expected number of IDs not found.");
        for(var expectedId of expectedNotFound){
          assert(notFound.indexOf(expectedId)!==-1, "Expecting ID to have been returned: "+expectedId);
        }
        done();
      }));
    });
    describe('Handle no Expression IDs being passed', function(){
      it('Should return an empty array when no Expression IDs to find are passed.', sinon.test(function(done){
        var lexiconToTest = lexicons.getAverageLexicon();
        var expressions = [];
        var notFound = policyObjectsHelper.checkLexiconExpressionsIdsOnLexicon(lexiconToTest, expressions);
        assert(notFound.length === 0, "Expecting empty array returned.");
        done();
      }));
    });
  });
});
