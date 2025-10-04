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
                                <h3>Running the sample</h3>
                                <ol>
                                    <li>Wait for the playground to finish installing dependencies (an in-browser npm install).</li>
                                    <li>
                                        Edit the Express handlers in the left editor and adjust the itdoc suite on the right.
                                        The bundled tests expect <code>/greeting</code> and <code>/users</code> routes by default.
                                    </li>
                                    <li>
                                        Press <strong>Run</strong> to execute <code>npm test</code> inside the WebContainer and monitor the
                                        terminal panel below for progress and results.
                                    </li>
                                    <li>
                                        When the tests pass, the latest OpenAPI document appears in the <code>oas.json</code> panel. Any
                                        failures will show in the terminal with hints on what to adjust.
                                    </li>
                                </ol>
                            </section>
                            <section>
                                <h3>Notes &amp; limitations</h3>
                                <ul>
                                    <li>
                                        The playground ships with a single mocha suite so the experience stays snappy. Feel free to extend
                                        the Express routes and assertions for experimentation.
                                    </li>
                                    <li>
                                        Each run executes in the same container session. Refresh the page if you want to reset the
                                        filesystem to the initial example.
                                    </li>
                                    <li>
                                        Network egress is required the first time you open the page because WebContainer fetches npm
                                        dependencies on demand.
                                    </li>
                                    <li>
                                        WebContainer relies on <code>SharedArrayBuffer</code>. Serve the docs with
                                        <code> Cross-Origin-Opener-Policy: same-origin</code> and
                                        <code> Cross-Origin-Embedder-Policy: require-corp</code> headers (or use a Chromium browser that supports
                                        the `none` COEP mode) to enable execution.
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
