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

import { getTestAdapterExports } from "../adapters"

/**
 * 케이스 별 테스트를 정의를 위한 함수
 * @param description 테스트 설명
 * @param testFn 테스트 함수
 */
export const itDoc = (description: string, testFn: () => Promise<void>): void => {
    if (!description) {
        throw new Error("Test description is required at itDoc.")
    }

    if (!testFn) {
        throw new Error("Test function is required at itDoc.")
    }

    const { itCommon } = getTestAdapterExports()
    itCommon(description, async () => {
        await testFn()
    })
}
