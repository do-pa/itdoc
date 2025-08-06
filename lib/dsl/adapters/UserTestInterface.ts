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

import { TestFramework } from "./TestFramework"

/**
 * Defines common DSL interface.
 * Wraps actual test framework functions to provide a unified interface.
 */
export interface UserTestInterface {
    name: TestFramework
    describe: (name: string, fn: () => void) => void
    it: (name: string, fn: () => void) => void
    before: (fn: () => void) => void
    after: (fn: () => void) => void
    beforeEach: (fn: () => void) => void
    afterEach: (fn: () => void) => void
    // expect: (fn: () => void) => void;
}
