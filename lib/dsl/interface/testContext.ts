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

import { AsyncLocalStorage } from "async_hooks"

const asyncLocalStorage = new AsyncLocalStorage<{ description: string }>()

/**
 * itDoc("Error occurs when password is less than 8 characters", () => {
 *
 * Utility for recording/sharing test descriptions like "Error occurs when password is less than 8 characters".
 */
export const testContext = {
    run<T>(description: string, fn: () => Promise<T> | T): Promise<T> | T {
        return asyncLocalStorage.run({ description }, fn)
    },
    get(): string | null {
        if (!asyncLocalStorage.getStore()) {
            throw new Error(
                "testContext is not initialized. Please use testContext.run() to initialize it.",
            )
        }

        return asyncLocalStorage.getStore()?.description ?? null
    },
}
