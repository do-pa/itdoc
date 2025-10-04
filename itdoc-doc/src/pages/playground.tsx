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

const PlaygroundPage: React.FC = () => {
    const [showHelp, setShowHelp] = useState(false)

    useEffect(() => {
        if (!showHelp || typeof document === "undefined") {
            return
        }

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [showHelp])

    useEffect(() => {
        if (!showHelp || typeof window === "undefined") {
            return
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowHelp(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [showHelp])

    return (
        <Layout title="Playground" description="Interactive itdoc playground backed by WebContainer.">
            <main className={`container margin-vert--lg ${styles.page}`}>
                <div className="row">
                    <div className="col col--12">
                        <header className={styles.header}>
                            <div className={styles.headerCopy}>
                                <h1 className={styles.title}>Playground</h1>
                                <p className={styles.subtitle}>
                                    Experience itdoc right in your browser—explore the DSL, run the bundled tests, and see how the
                                    library captures API behavior without leaving this page.
                                </p>
                            </div>
                            <button className={styles.helpButton} type="button" onClick={() => setShowHelp(true)}>
                                How to use
                            </button>
                        </header>
                        <BrowserOnly fallback={<div className={styles.fallback}>The playground loads in the browser only.</div>}>
                            {() => {
                                const Playground = require("@site/src/components/Playground").default
                                return <Playground />
                            }}
                        </BrowserOnly>
                    </div>
                </div>
            </main>
            {showHelp ? (
                <div
                    className={styles.modalBackdrop}
                    role="presentation"
                    onClick={() => setShowHelp(false)}
                >
                    <div
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={instructionsTitleId}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h2 id={instructionsTitleId}>How to use the playground</h2>
                            <button className={styles.closeButton} type="button" onClick={() => setShowHelp(false)}>
                                Close
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <section>
                                <h3>Get started quickly</h3>
                                <ol>
                                    <li>
                                        Let the installer finish booting the WebContainer. The status pill flips to <strong>Ready</strong>
                                        once the in-browser <code>npm install</code> wraps up.
                                    </li>
                                    <li>
                                        Tweak the Express handlers on the left and mirror the expectations in the itdoc test suite on the
                                        right. The default scenario wires up <code>/greeting</code> and <code>/users</code> endpoints.
                                    </li>
                                    <li>
                                        Hit <strong>Run</strong> to execute <code>npm test</code>. Watch the terminal for install logs,
                                        assertions, and any failures.
                                    </li>
                                    <li>
                                        Green tests regenerate the OpenAPI output in <code>oas.json</code>. Red output points to the exact
                                        assertion or handler that needs an update.
                                    </li>
                                </ol>
                            </section>
                            <section>
                                <h3>Good to know</h3>
                                <ul>
                                    <li>
                                        The playground keeps a single mocha suite so everything stays responsive. Add routes and assertions,
                                        but keep an eye on runtime as you experiment.
                                    </li>
                                    <li>
                                        Your container state persists between runs. Reload the page anytime you want to reset the sample
                                        project to its starting point.
                                    </li>
                                    <li>
                                        The first visit downloads npm packages. Afterwards, runs are cached and should complete much faster.
                                    </li>
                                    <li>
                                        WebContainer needs <code>SharedArrayBuffer</code> support. Serve the docs with
                                        <code>Cross-Origin-Opener-Policy: same-origin</code> and
                                        <code>Cross-Origin-Embedder-Policy: require-corp</code>, or open the playground in a Chromium browser
                                        that enables those headers for you.
                                    </li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            ) : null}
        </Layout>
    )
}

export default PlaygroundPage
