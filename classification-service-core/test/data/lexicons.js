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
//example lexicon data for use with tests
module.exports = {
  getEmptyLexicon: getEmptyLexicon,
  getAverageLexicon: getAverageLexicon
};

function getEmptyLexicon(){
  return {
    "type": "lexicon",
    "id": 12,
    "name": "No Expressions",
    "description": "A lexicon with no Expressions",
    "additional": {
      "lexicon_expressions": []
    }
  };
}

function getAverageLexicon(){
 return {
  "type": "lexicon",
  "id": 11,
  "name": "Travel Company Email Domain Names",
  "description": "A lexicon of Travel Company Email Domain Names",
  "additional": {
    "lexicon_expressions": [
      {
        "type": "lexicon_expression",
        "id": 67,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.fr\" OR \"reservation*@*.fr\" OR \"travel*@*.fr\""
        }
      },
      {
        "type": "lexicon_expression",
        "id": 66,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.com\" OR \"reservation*@*.com\" OR \"travel*@*.com\""
        }
      },
      {
        "type": "lexicon_expression",
        "id": 65,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.ie\" OR \"reservation*@*.ie\" OR \"travel*@*.ie\""
        }
      },
      {
        "type": "lexicon_expression",
        "id": 64,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.uk\" OR \"reservation*@*.uk\" OR \"travel*@*.uk\""
        }
      },
      {
        "type": "lexicon_expression",
        "id": 63,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.us\" OR \"reservation*@*.us\" OR \"travel*@*.us\""
        }
      },
      {
        "type": "lexicon_expression",
        "id": 62,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.dk\" OR \"reservation*@*.dk\" OR \"travel*@*.dk\""
        }
      },
      {
        "type": "lexicon_expression",
        "id": 61,
        "additional": {
          "lexicon_id": 11,
          "type": "text",
          "expression": "\"booking*@*.de\" OR \"reservation*@*.de\" OR \"travel*@*.de\""
        }
      }
    ]}
  };
}