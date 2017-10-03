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
package com.github.cafdataprocessing.classification.service.tests.utils;

import com.github.cafdataprocessing.classification.service.client.ApiClient;

/**
 * Provides an ApiClient instance that other classes can use.
 */
public class ApiClientProvider {
    private static final String connectionUrl;
    private static final ApiClient apiClient = new ApiClient();

    private ApiClientProvider(){}

    /**
     * Initialize the apiClient that this class will provide to callers.
     */
    static {
        connectionUrl = EnvironmentPropertyProvider.getWebServiceUrl();
        apiClient.setBasePath(connectionUrl);
    }

    /**
     * Get the ApiClient instance.
     * @return ApiClient instance. This is a single instance returned for all calls to this method.
     */
    public static ApiClient getApiClient(){
        return apiClient;
    }

    /**
     * Get the connection URL for the classification service.
     * @return
     */
    public static String getApiConnectionUrl(){
        return connectionUrl;
    }
}
