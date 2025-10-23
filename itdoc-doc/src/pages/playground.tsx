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

import React, { useEffect, useState } from "react"
import BrowserOnly from "@docusaurus/BrowserOnly"
import Layout from "@theme/Layout"

import styles from "./playground.module.css"

const instructionsTitleId = "playground-help-title"

interface PlaygroundHelpModalProps {
    onClose: () => void
}

const PlaygroundHelpModal: React.FC<PlaygroundHelpModalProps> = ({ onClose }) => (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
        <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={instructionsTitleId}
            onClick={(event) => event.stopPropagation()}
        >
            <div className={styles.modalHeader}>
                <h2 id={instructionsTitleId}>How to use the playground</h2>
                <button className={styles.closeButton} type="button" onClick={onClose}>
                    Close
                </button>
            </div>
            <div className={styles.modalBody}>
                <section>
                    <h3>Get started quickly</h3>
                    <ol>
                        <li>
                            Let the installer finish booting the WebContainer. The status pill flips
                            to <strong>Ready</strong> once the in-browser <code>npm install</code>{" "}
                            wraps up.
                        </li>
                        <li>
                            Write a simple API using Express and create an itdoc test for it. The
                            default scenario wires up <code>/greeting</code> and <code>/users</code>{" "}
                            endpoints.
                        </li>
                        <li>
                            Hit <strong>Run</strong> to execute <code>npm test</code>. Watch the
                            terminal for install logs, assertions, and any failures.
                        </li>
                        <li>
                            Green tests regenerate the OpenAPI output in <code>oas.json</code>. Red
                            output points to the exact assertion or handler that needs an update.
                        </li>
                    </ol>
                </section>
            </div>
        </div>
    </div>
)

const PlaygroundPage: React.FC = () => {
    const [showHelp, setShowHelp] = useState(false)

    useEffect(() => {
        if (!showHelp || typeof window === "undefined") {
            return
        }

        const { body } = document
        const originalOverflow = body.style.overflow
        body.style.overflow = "hidden"

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowHelp(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            body.style.overflow = originalOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [showHelp])

    return (
        <Layout
            title="Playground"
            description="Interactive itdoc playground backed by WebContainer."
        >
            <main className={`container margin-vert--lg ${styles.page}`}>
                <div className="row">
                    <div className="col col--12">
                        <BrowserOnly
                            fallback={
                                <div className={styles.fallback}>
                                    The playground loads in the browser only.
                                </div>
                            }
                        >
                            {() => {
                                const Playground =
                                    require("@site/src/components/Playground").default
                                return <Playground onRequestHelp={() => setShowHelp(true)} />
                            }}
                        </BrowserOnly>
                    </div>
                </div>
            </main>
            {showHelp ? <PlaygroundHelpModal onClose={() => setShowHelp(false)} /> : null}
        </Layout>
    )
}

export default PlaygroundPage
