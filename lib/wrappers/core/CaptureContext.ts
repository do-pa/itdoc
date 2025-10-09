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
import { ApiDocMetadata, CapturedRequest } from "../types"

/**
 * Store structure for AsyncLocalStorage
 */
export interface CaptureStore {
    description: string
    metadata?: ApiDocMetadata
    capturedRequests: CapturedRequest[]
}

/**
 * Context manager for capturing HTTP requests/responses using AsyncLocalStorage
 * This ensures thread-safe isolation of captured data across concurrent tests
 */
export class CaptureContext {
    private static storage = new AsyncLocalStorage<CaptureStore>()

    /**
     * Run a function within a capture context
     * @param description Test description
     * @param metadata Optional API documentation metadata
     * @param fn Function to execute
     * @returns Result of the function
     */
    public static run<T>(
        description: string,
        metadata: ApiDocMetadata | undefined,
        fn: () => T | Promise<T>,
    ): T | Promise<T> {
        const store: CaptureStore = {
            description,
            metadata,
            capturedRequests: [],
        }
        return this.storage.run(store, fn)
    }

    /**
     * Get the current capture store
     * @returns Current store or undefined if not in capture context
     */
    public static getStore(): CaptureStore | undefined {
        return this.storage.getStore()
    }

    /**
     * Check if capture context is currently active
     * @returns true if active, false otherwise
     */
    public static isActive(): boolean {
        return this.storage.getStore() !== undefined
    }

    /**
     * Add a new request to the capture store
     * @param request Partial request data
     */
    public static addRequest(request: Partial<CapturedRequest>): void {
        const store = this.getStore()
        if (store) {
            store.capturedRequests.push(request as CapturedRequest)
        }
    }

    /**
     * Update the last captured request with additional data
     * @param data Partial request data to merge
     */
    public static updateLastRequest(data: Partial<CapturedRequest>): void {
        const store = this.getStore()
        if (store && store.capturedRequests.length > 0) {
            const last = store.capturedRequests[store.capturedRequests.length - 1]
            Object.assign(last, data)
        }
    }

    /**
     * Get all captured requests from current context
     * @returns Array of captured requests
     */
    public static getCapturedRequests(): CapturedRequest[] {
        return this.getStore()?.capturedRequests || []
    }

    /**
     * Clear all captured requests (useful for testing)
     */
    public static clear(): void {
        const store = this.getStore()
        if (store) {
            store.capturedRequests = []
        }
    }
}
