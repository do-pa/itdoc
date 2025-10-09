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
import type { InstallStatus, PlaygroundFileDefinition } from "./types"

interface TopBarProps {
    installStatus: InstallStatus
    statusLabel: string
    isRunning: boolean
    runDisabled: boolean
    onRun: () => void
    onRequestHelp?: () => void
    activeFile: PlaygroundFileDefinition | null
}

const TopBar: React.FC<TopBarProps> = ({
    installStatus,
    statusLabel,
    isRunning,
    runDisabled,
    onRun,
    onRequestHelp,
    activeFile,
}) => {
    return (
        <header className={styles.commandBar}>
            <div className={styles.commandContext}>
                <p className={styles.commandTitle}>itdoc playground</p>
                {activeFile ? (
                    <div className={styles.commandMeta}>
                        <span className={styles.commandMetaLabel}>Editing</span>
                        <span className={styles.commandPath}>{activeFile.path}</span>
                        <span className={styles.commandDescription}>{activeFile.description}</span>
                    </div>
                ) : null}
            </div>
            <div className={styles.commandActions}>
                <span className={styles.statusChip} data-status={installStatus}>
                    {statusLabel}
                </span>
                {onRequestHelp ? (
                    <button
                        type="button"
                        className={styles.topHelpButton}
                        onClick={onRequestHelp}
                    >
                        How to use
                    </button>
                ) : null}
                <button
                    className={styles.runButton}
                    type="button"
                    onClick={onRun}
                    disabled={runDisabled}
                >
                    {isRunning ? "Running..." : "Run"}
                </button>
            </div>
        </header>
    )
}

export default TopBar
