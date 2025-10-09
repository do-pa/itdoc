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

import React, { useMemo } from "react"
import Editor, { OnMount } from "@monaco-editor/react"

import styles from "./styles.module.css"
import type { PlaygroundFileId, PlaygroundFileMap } from "./types"

interface EditorTabsProps {
    files: PlaygroundFileMap
    openFiles: PlaygroundFileId[]
    activeFileId: PlaygroundFileId
    onSelectFile: (fileId: PlaygroundFileId) => void
    onCloseTab: (fileId: PlaygroundFileId) => void
    onEditorChange: (value: string | undefined) => void
    onEditorMount: OnMount
    activeFileValue: string
    oasOutput: string
    onOpenPreview: () => void
    canCloseTabs: boolean
}

const EditorTabs: React.FC<EditorTabsProps> = ({
    files,
    openFiles,
    activeFileId,
    onSelectFile,
    onCloseTab,
    onEditorChange,
    onEditorMount,
    activeFileValue,
    oasOutput,
    onOpenPreview,
    canCloseTabs,
}) => {
    const activeFile = useMemo(() => files[activeFileId] ?? null, [files, activeFileId])

    return (
        <section className={styles.editorPane}>
            <div className={styles.tabBar} role="tablist">
                {openFiles.map((fileId) => {
                    const file = files[fileId]
                    const isActive = activeFileId === fileId
                    const tabId = `editor-tab-${file.id}`
                    const panelId = `editor-panel-${file.id}`

                    return (
                        <div
                            key={fileId}
                            className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ""}`}
                            role="presentation"
                        >
                            <button
                                type="button"
                                className={styles.tabButton}
                                role="tab"
                                id={tabId}
                                aria-controls={isActive ? panelId : undefined}
                                aria-selected={isActive}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => onSelectFile(fileId)}
                            >
                                {file.label}
                            </button>
                            <button
                                type="button"
                                className={styles.tabClose}
                                onClick={() => onCloseTab(fileId)}
                                aria-label={`Close ${file.label}`}
                                disabled={!canCloseTabs}
                            >
                                x
                            </button>
                        </div>
                    )
                })}
            </div>
            <div
                className={styles.editorSurface}
                role="tabpanel"
                id={activeFile ? `editor-panel-${activeFile.id}` : undefined}
                aria-labelledby={activeFile ? `editor-tab-${activeFile.id}` : undefined}
                tabIndex={activeFile ? 0 : -1}
            >
                {activeFile ? (
                    <Editor
                        key={activeFile.id}
                        value={activeFileValue}
                        language={activeFile.language}
                        path={activeFile.monacoUri}
                        onMount={onEditorMount}
                        onChange={onEditorChange}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            readOnly: !activeFile.editable,
                            automaticLayout: true,
                            tabSize: 4,
                        }}
                    />
                ) : null}
            </div>
            <div className={styles.editorFooter}>
                <p className={styles.hint}>
                    Tip: Keep the Express app and itdoc tests aligned before you run the suite.
                </p>
            </div>
        </section>
    )
}

export default EditorTabs
