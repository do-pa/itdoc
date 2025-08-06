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

export type { TestResult, IOpenAPIGenerator } from "./types/TestResult"

export { OpenAPIGenerator } from "./OpenAPIGenerator"
export { TestResultCollector } from "./TestResultCollector"

export { SchemaBuilder } from "./builders/SchemaBuilder"
export { OperationBuilder } from "./builders/OperationBuilder"

import logger from "../../config/logger"

import { TestResultCollector } from "./TestResultCollector"
import { TestEventManager } from "./TestEventManager"
export const resultCollector = TestResultCollector.getInstance()
export const testEventManager = TestEventManager.getInstance()

/**
 * Records test failure.
 * If called even once, automatic OAS generation will be skipped.
 */
export const recordTestFailure = (): void => {
    testEventManager.completeTestFailure()
    logger.debug("Test failure recorded, OAS generation will be skipped.")
}
