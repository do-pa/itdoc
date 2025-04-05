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

export class MochaAdapter implements UserTestInterface {
    public name = TestFramework.Mocha
    private mochaGlobals: any

    public constructor() {
        this.mochaGlobals = {
            describe: global.describe,
            it: global.it,
            before: global.before,
            after: global.after,
            beforeEach: global.beforeEach,
            afterEach: global.afterEach,
        }
    }

    public describe(name: string, fn: () => void): void {
        this.mochaGlobals.describe(name, fn)
    }

    public it(name: string, fn: () => void): void {
        this.mochaGlobals.it(name, fn)
    }

    public before(fn: () => void): void {
        this.mochaGlobals.before(fn)
    }

    public after(fn: () => void): void {
        this.mochaGlobals.after(fn)
    }

    public beforeEach(fn: () => void): void {
        this.mochaGlobals.beforeEach(fn)
    }

    public afterEach(fn: () => void): void {
        this.mochaGlobals.afterEach(fn)
    }
}
