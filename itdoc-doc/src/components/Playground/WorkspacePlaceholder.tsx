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

interface WorkspacePlaceholderProps {
    tipTitle?: string
    tipBody?: string
    onNextTip?: () => void
}

const WorkspacePlaceholder: React.FC<WorkspacePlaceholderProps> = ({
    tipTitle,
    tipBody,
    onNextTip,
}) => {
    return (
        <div className={styles.workspacePlaceholder}>
            <p className={styles.placeholderTitle}>Booting your sandbox…</p>
            <p className={styles.placeholderCopy}>
                WebContainer is preparing the environment. Dependencies install automatically the
                first time the playground loads.
            </p>
            {tipTitle && tipBody ? (
                <aside className={styles.tipCard}>
                    <div className={styles.tipHeader}>
                        <span className={styles.tipLabel}>While you wait</span>
                        {onNextTip ? (
                            <button
                                type="button"
                                className={styles.tipButton}
                                onClick={onNextTip}
                            >
                                Show another idea
                            </button>
                        ) : null}
                    </div>
                    <p className={styles.tipTitle}>{tipTitle}</p>
                    <p className={styles.tipBody}>{tipBody}</p>
                </aside>
            ) : null}
        </div>
    )
}

export default WorkspacePlaceholder
