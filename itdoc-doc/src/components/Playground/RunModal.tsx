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
import Editor from "@monaco-editor/react"

import styles from "./styles.module.css"

interface RunModalProps {
    isOpen: boolean
    titleId: string
    dockStatusMessage: string
    onClose: () => void
    terminalHostRef: React.RefObject<HTMLDivElement | null>
    oasOutput: string
    onOpenPreview: () => void
}

const RunModal: React.FC<RunModalProps> = ({
    isOpen,
    titleId,
    dockStatusMessage,
    onClose,
    terminalHostRef,
    oasOutput,
    onOpenPreview,
}) => {
    if (!isOpen) {
        return null
    }

    return (
        <div
            className={styles.runModalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={onClose}
        >
            <div className={styles.runModal} onClick={(event) => event.stopPropagation()}>
                <div className={styles.runModalHeader}>
                    <div className={styles.runModalHeadingGroup}>
                        <h2 id={titleId}>Run output</h2>
                        <span className={styles.runModalStatus}>{dockStatusMessage}</span>
                    </div>
                    <button type="button" className={styles.runModalClose} onClick={onClose}>
                        Close
                    </button>
                </div>
                <div className={styles.runModalBody}>
                    <section className={styles.runModalColumn}>
                        <div className={styles.runModalCard}>
                            <div className={styles.runModalCardHeader}>
                                <h3 className={styles.runModalCardTitle}>Terminal</h3>
                                <span className={styles.runModalChip}>{dockStatusMessage}</span>
                            </div>
                            <div className={styles.runModalCardBody}>
                                <div className={styles.terminalShell}>
                                    <div className={styles.terminalChrome}>
                                        <span className={`${styles.terminalDot} ${styles.dotRed}`} />
                                        <span className={`${styles.terminalDot} ${styles.dotYellow}`} />
                                        <span className={`${styles.terminalDot} ${styles.dotGreen}`} />
                                    </div>
                                    <div className={styles.terminalOutput}>
                                        <div ref={terminalHostRef} className={styles.terminalViewport} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className={styles.runModalColumn}>
                        <div className={styles.runModalCard}>
                            <div className={styles.runModalCardHeader}>
                                <h3 className={styles.runModalCardTitle}>Generated docs by itdoc</h3>
                                <button
                                    type="button"
                                    className={styles.previewLaunchButton}
                                    onClick={onOpenPreview}
                                    disabled={!oasOutput}
                                >
                                    Fullscreen preview
                                </button>
                            </div>
                            <div className={styles.runModalCardBody}>
                                <div className={styles.oasWorkspace}>
                                    <div className={`${styles.codeSurface} ${styles.oasEditorCard}`}>
                                        <div className={styles.codeChrome}>oas.json</div>
                                        <div className={styles.oasEditorSurface}>
                                            {oasOutput ? (
                                                <Editor
                                                    value={oasOutput}
                                                    language="json"
                                                    path="file:///output/oas.json"
                                                    theme="vs-dark"
                                                    height="100%"
                                                    options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        lineNumbers: "on",
                                                        scrollBeyondLastLine: false,
                                                        automaticLayout: true,
                                                        fontSize: 13,
                                                    }}
                                                />
                                            ) : (
                                                <p className={styles.oasEmpty}>
                                                    Run the tests to generate the OpenAPI document.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default RunModal
