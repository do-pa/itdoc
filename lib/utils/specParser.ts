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

export interface SpecMetadata {
    app?: string
    [key: string]: any
}

export interface ParsedSpec {
    metadata: SpecMetadata
    content: string
}

/**
 * testspec.md 파일의 YAML front matter를 파싱합니다.
 * @param specContent - testspec.md 파일의 전체 내용
 * @returns 파싱된 메타데이터와 콘텐츠
 */
export function parseSpecFile(specContent: string): ParsedSpec {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
    const match = specContent.match(frontMatterRegex)

    if (!match) {
        return {
            metadata: {},
            content: specContent,
        }
    }

    const [, yamlContent, content] = match
    const metadata = parseYaml(yamlContent)

    return {
        metadata,
        content: content.trim(),
    }
}

/**
 * 간단한 YAML 파서 (키-값 쌍만 지원)
 * @param yamlContent - YAML 내용
 * @returns 파싱된 객체
 */
function parseYaml(yamlContent: string): SpecMetadata {
    const result: SpecMetadata = {}
    const lines = yamlContent.split("\n")

    for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue
        }

        const colonIndex = trimmedLine.indexOf(":")
        if (colonIndex === -1) {
            continue
        }

        const key = trimmedLine.substring(0, colonIndex).trim()
        const value = trimmedLine.substring(colonIndex + 1).trim()

        result[key] = value
    }

    return result
}
