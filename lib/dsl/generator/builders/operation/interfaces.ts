/*
 * Copyright 2025 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TestResult } from "../../types/TestResult"
import { ParameterObject, RequestBodyObject, ResponseObject } from "../../types/OpenAPITypes"

/**
 * Interface for creating OpenAPI Operation objects
 */
export interface OperationBuilderInterface {
    /**
     * Creates OpenAPI Operation object from test results.
     * @param result Test result
     * @returns OpenAPI Operation object
     */
    generateOperation(result: TestResult): Record<string, unknown>
}

/**
 * Interface for parameter generation
 */
export interface ParameterBuilderInterface {
    /**
     * Extracts parameters from test results.
     * @param result Test result
     * @returns Array of parameter objects
     */
    extractParameters(result: TestResult): ParameterObject[]
}

/**
 * Interface for handling security requirements
 */
export interface SecurityBuilderInterface {
    /**
     * Extracts security requirements from test results.
     * @param result Test result
     * @returns Array of security requirements
     */
    extractSecurityRequirements(result: TestResult): Array<Record<string, string[]>>

    /**
     * Gets the security schemas.
     * @returns Currently registered security schema map
     */
    getSecuritySchemes(): Record<string, any>
}

/**
 * Interface for request body generation
 */
export interface RequestBodyBuilderInterface {
    /**
     * Generates the request body.
     * @param result Test result
     * @returns Request body object or undefined
     */
    generateRequestBody(result: TestResult): RequestBodyObject | undefined
}

/**
 * Interface for response object generation
 */
export interface ResponseBuilderInterface {
    /**
     * Generates responses.
     * @param result Test result
     * @returns Response object map
     */
    generateResponses(result: TestResult): Record<string, ResponseObject>
}

/**
 * Interface for utility functions
 */
export interface UtilityBuilderInterface {
    /**
     * Generates operationId from test results.
     * @param result Test result
     * @returns Generated operationId
     */
    generateOperationId(result: TestResult): string

    /**
     * Generates default tag from path.
     * @param path API path
     * @returns Default tag
     */
    generateDefaultTag(path: string): string
}
