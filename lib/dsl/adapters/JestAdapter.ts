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
import { UserTestInterface } from "./UserTestInterface"

export class JestAdapter implements UserTestInterface {
    public name = TestFramework.Jest

    public describe(name: string, fn: () => void): void {
        global.describe(name, fn)
    }

    public it(name: string, fn: () => void): void {
        global.it(name, fn)
    }

    public before(fn: () => void): void {
        ;(global as any).beforeAll(fn)
    }

    public after(fn: () => void): void {
        ;(global as any).afterAll(fn)
    }

    public beforeEach(fn: () => void): void {
        global.beforeEach(fn)
    }

    public afterEach(fn: () => void): void {
        global.afterEach(fn)
    }
}
