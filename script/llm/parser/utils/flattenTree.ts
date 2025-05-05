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

/**
 * 주어진 의존성 트리 객체를 재귀적으로 플래트닝하여
 * 모든 파일 경로를 문자열 배열로 반환합니다.
 * @param {Record<string, any>} tree - dependency-tree 라이브러리로 생성된 트리 객체
 * @returns {string[]} 모든 파일 경로를 담은 문자열 배열
 */
export function flattenTree(tree: Record<string, any>): string[] {
    return Object.keys(tree).reduce<string[]>(
        (acc, file) => acc.concat(file, flattenTree(tree[file] || {})),
        [],
    )
}
