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

import React from "react"

import styles from "./styles.module.css"
import type { ExplorerNode, PlaygroundFileId, PlaygroundFileMap } from "./types"

interface FileExplorerProps {
    nodes: ExplorerNode[]
    files: PlaygroundFileMap
    activeFileId: PlaygroundFileId
    openFiles: PlaygroundFileId[]
    onSelectFile: (fileId: PlaygroundFileId) => void
}

const FileExplorer: React.FC<FileExplorerProps> = ({
    nodes,
    files,
    activeFileId,
    openFiles,
    onSelectFile,
}) => {
    return (
        <aside className={styles.explorer}>
            <div className={styles.explorerHeader}>Explorer</div>
            <nav aria-label="Playground files" className={styles.tree}>
                <div className={styles.treeRoot} aria-hidden="true">
                    /
                </div>
                {nodes.map((node) => {
                    if (node.type === "folder") {
                        return (
                            <div className={styles.treeFolder} key={node.label}>
                                <div className={styles.treeFolderLabel}>
                                    <span className={`${styles.treeIcon} ${styles.treeIconFolder}`} aria-hidden="true" />
                                    {node.label}
                                </div>
                                <div className={styles.treeChildren}>
                                    {node.children.map((child) => {
                                        const file = files[child.fileId]
                                        const isActive = activeFileId === child.fileId
                                        const isOpen = openFiles.includes(child.fileId)
                                        return (
                                            <button
                                                key={child.fileId}
                                                type="button"
                                                className={`${styles.treeItem} ${
                                                    isActive ? styles.treeItemActive : ""
                                                } ${isOpen ? styles.treeItemOpen : ""}`}
                                                onClick={() => onSelectFile(child.fileId)}
                                                aria-current={isActive ? true : undefined}
                                            >
                                                <span
                                                    className={`${styles.treeIcon} ${styles.treeIconFile}`}
                                                    aria-hidden="true"
                                                />
                                                <span className={styles.treeLabel}>{file.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    }

                    const file = files[node.fileId]
                    const isActive = activeFileId === node.fileId
                    const isOpen = openFiles.includes(node.fileId)

                    return (
                        <button
                            key={node.fileId}
                            type="button"
                            className={`${styles.treeItem} ${isActive ? styles.treeItemActive : ""} ${
                                isOpen ? styles.treeItemOpen : ""
                            }`}
                            onClick={() => onSelectFile(node.fileId)}
                            aria-current={isActive ? true : undefined}
                        >
                            <span
                                className={`${styles.treeIcon} ${styles.treeIconFile}`}
                                aria-hidden="true"
                            />
                            <span className={styles.treeLabel}>{file.label}</span>
                        </button>
                    )
                })}
            </nav>
        </aside>
    )
}

export default FileExplorer
