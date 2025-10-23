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
import type { InstallStatus } from "./types"

interface InstallOverlayProps {
    isVisible: boolean
    isInstalling: boolean
    installStatus: InstallStatus
    currentMilestone: { title: string; description: string } | null
    milestones: { title: string; description: string }[]
    activeMilestoneIndex: number
    progressPercent: number
    formattedElapsed: string
    showFinalizingHint: boolean
    waitingTipTitle?: string
    waitingTipBody?: string
    onNextTip?: () => void
    errorMessage: string | null
}

const InstallOverlay: React.FC<InstallOverlayProps> = ({
    isVisible,
    isInstalling,
    installStatus,
    currentMilestone,
    milestones,
    activeMilestoneIndex,
    progressPercent,
    formattedElapsed,
    showFinalizingHint,
    waitingTipTitle,
    waitingTipBody,
    onNextTip,
    errorMessage,
}) => {
    if (!isVisible) {
        return null
    }

    const renderTipCard = () => {
        if (!waitingTipTitle || !waitingTipBody) {
            return null
        }

        return (
            <aside className={styles.tipCard}>
                <div className={styles.tipHeader}>
                    <span className={styles.tipLabel}>While you wait</span>
                    {onNextTip ? (
                        <button type="button" className={styles.tipButton} onClick={onNextTip}>
                            Show another idea
                        </button>
                    ) : null}
                </div>
                <p className={styles.tipTitle}>{waitingTipTitle}</p>
                <p className={styles.tipBody}>{waitingTipBody}</p>
            </aside>
        )
    }

    return (
        <div
            className={styles.installOverlay}
            role="status"
            aria-live="polite"
            aria-busy={isInstalling}
        >
            {isInstalling && currentMilestone ? (
                <section className={styles.installCard}>
                    <div className={styles.progressIntro}>
                        <div className={styles.progressContext}>
                            <span className={styles.progressSpinner} aria-hidden="true" />
                            <div>
                                <p className={styles.progressLabel}>Setting up your workspace</p>
                                <p className={styles.progressTitle}>{currentMilestone.title}</p>
                            </div>
                        </div>
                        <span className={styles.progressPercent}>{progressPercent}%</span>
                    </div>
                    <div className={styles.installBody}>
                        <div className={styles.installTimeline}>
                            <p className={styles.progressDescription}>{currentMilestone.description}</p>
                            <div
                                className={styles.progressBar}
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={progressPercent}
                            >
                                <span
                                    className={styles.progressBarFill}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <ul className={styles.milestoneList}>
                                {milestones.map((milestone, index) => {
                                    const stateClass =
                                        index < activeMilestoneIndex
                                            ? styles.milestoneItemComplete
                                            : index === activeMilestoneIndex
                                              ? styles.milestoneItemActive
                                              : styles.milestoneItemUpcoming

                                    return (
                                        <li
                                            key={milestone.title}
                                            className={`${styles.milestoneItem} ${stateClass}`}
                                        >
                                            <span className={styles.milestoneBullet} aria-hidden="true" />
                                            <span className={styles.milestoneLabel}>{milestone.title}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                            <div className={styles.elapsedTimer}>Elapsed: {formattedElapsed}</div>
                            {showFinalizingHint ? (
                                <p className={styles.finalizingHint}>
                                    Almost there—WebContainer is preparing the editors and terminal. This
                                    final step can take up to a minute the first time the sandbox boots.
                                </p>
                            ) : null}
                        </div>
                        {renderTipCard()}
                    </div>
                </section>
            ) : installStatus === "error" ? (
                <div className={styles.installErrorCard}>
                    <h2>Environment failed to start</h2>
                    <p>{errorMessage ?? "An unexpected error occurred during setup."}</p>
                    <p className={styles.installErrorHint}>
                        Refresh the page to try again or verify your browser supports WebContainer.
                    </p>
                </div>
            ) : null}
        </div>
    )
}

export default InstallOverlay
