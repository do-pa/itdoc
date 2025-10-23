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

export type InstallStatus = "idle" | "installing" | "ready" | "error"

export type PlaygroundFileId = "app" | "test" | "package"

export interface PlaygroundFileDefinition {
    id: PlaygroundFileId
    label: string
    path: string
    description: string
    language: "javascript" | "json"
    monacoUri: string
    editable: boolean
}

export interface ExplorerFileNode {
    type: "file"
    fileId: PlaygroundFileId
    label: string
}

export interface ExplorerFolderNode {
    type: "folder"
    label: string
    children: ExplorerFileNode[]
}

export type ExplorerNode = ExplorerFileNode | ExplorerFolderNode

export type PlaygroundFileMap = Record<PlaygroundFileId, PlaygroundFileDefinition>
