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
package com.github.cafdataprocessing.classification.service.creation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cafdataprocessing.classification.service.creation.jsonobjects.CreationJson;

import java.io.File;
import java.io.IOException;

/**
 * Converts workflow input representations to classification service workflow
 */
public class CreationInputJsonConverter {
    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Read the file at the location provided into a CreationJson object.
     * @param inputFileLocation Path to the file that should be read.
     * @return Constructed CreationJson representation of the file contents.
     * @throws IOException If file contents could not be converted to a CreationJson object.
     */
    public static CreationJson readInputFile(String inputFileLocation) throws IOException {
        File inputFile = new File(inputFileLocation);
        return readInputFile(inputFile);
    }

    /**
     * Read the file provided into a CreationJson object.
     * @param inputFile File that should be read.
     * @return Constructed CreationJson representation of the file contents.
     * @throws IOException If file contents could not be converted to a CreationJson object.
     */
    public static CreationJson readInputFile(File inputFile) throws IOException {
        try {
            return mapper.readValue(inputFile, CreationJson.class);
        } catch (IOException e) {
            throw new IOException("Failure trying to deserialize the workflow input file. Please check the format of the file contents.",
                    e);
        }
    }
}
