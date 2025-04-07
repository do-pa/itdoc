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

import { readItdocConfig } from "./readPackageJson"

/**
 * 생성될 OAS에 설정된 서버 주소를 가져옴.
 */
export function getOpenAPIBaseUrl(): string {
    return readItdocConfig("document.baseUrl", "http://localhost:8080")
}

/**
 * 생성될 OAS에 설정될 TITLE을 가져옴.,
 */
export function getOpenAPITitle(): string {
    return readItdocConfig("document.title", "API Document")
}

/**
 * 생성될 OAS에 설정될 Top-Level 문서 설명을 가져옴.
 */
export function getOpenAPIDocumentDescription(): string {
    return readItdocConfig(
        "document.description",
        "You can change the description by specifying it in package.json.",
    )
}
