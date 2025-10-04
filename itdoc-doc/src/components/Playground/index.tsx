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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment"
import useBaseUrl from "@docusaurus/useBaseUrl"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import styles from "./styles.module.css"

const itdocTarballAsset = "/playground/itdoc.tgz"
const FALLBACK_ITDOC_VERSION = "^0.4.1"

type FileSystemTree = import("@webcontainer/api").FileSystemTree
type WebContainerInstance = import("@webcontainer/api").WebContainer
type WebContainerProcess = import("@webcontainer/api").Process

type InstallStatus = "idle" | "installing" | "ready" | "error"

declare global {
    interface Window {
        Redoc?: {
            init: (spec: unknown, options: Record<string, unknown>, element: HTMLElement) => void
        }
    }
}

const REDOC_CDN_URL = "https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"

const initialExpressCode = `const express = require("express")

const app = express()

app.use(express.json())

app.get("/greeting", (req, res) => {
    res.status(200).json({
        message: "Hello from the itdoc playground!",
    })
})

app.post("/users", (req, res) => {
    const { name, email } = req.body

    if (!name || !email) {
        return res.status(400).json({
            error: "Both name and email are required.",
        })
    }

    const user = {
        id: "user_123",
        name,
        email,
    }

    return res.status(201).json(user)
})

module.exports = app
`

const initialTestCode = `const { describeAPI, itDoc, HttpMethod, HttpStatus, field } = require("itdoc")
const app = require("../app")

describeAPI(
    HttpMethod.GET,
    "/greeting",
    {
        summary: "Retrieve greeting message",
        tag: "Greetings",
        description: "Returns a friendly greeting from the Express application.",
    },
    app,
    (apiDoc) => {
        itDoc("returns greeting payload", async () => {
            await apiDoc
                .test()
                .prettyPrint()
                .req()
                .res()
                .status(HttpStatus.OK)
                .body({
                    message: field("Greeting message", "Hello from the itdoc playground!"),
                })
        })
    },
)

describeAPI(
    HttpMethod.POST,
    "/users",
    {
        summary: "Create a user",
        tag: "Users",
        description: "Creates a new user and returns the created resource.",
    },
    app,
    (apiDoc) => {
        itDoc("creates a user and returns details", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    name: field("User name", "Ada Lovelace"),
                    email: field("User email", "ada@example.com"),
                })
                .res()
                .status(HttpStatus.CREATED)
                .body({
                    id: field("Generated identifier", "user_123"),
                    name: field("User name", "Ada Lovelace"),
                    email: field("User email", "ada@example.com"),
                })
        })
    },
)
`

const installMilestones = [
    {
        title: "Booting WebContainer runtime",
        description:
            "Spinning up the in-browser Node.js environment so the playground can run without leaving this tab.",
    },
    {
        title: "Fetching local itdoc build",
        description:
            "Retrieving the bundled itdoc package and aligning dependencies before npm install kicks off.",
    },
    {
        title: "Installing npm dependencies",
        description:
            "Downloading and linking packages inside the WebContainer workspace. Keep an eye on the terminal for live logs.",
    },
    {
        title: "Finalizing workspace",
        description:
            "Wiring up editors, terminal, and previews so you can start tweaking the Express app and tests.",
    },
]

const waitingTips = [
    {
        title: "Skim the sample Express routes",
        body: "Plan which handlers you want to change first—maybe adjust the greeting copy or add a new status code.",
    },
    {
        title: "Draft your first assertion",
        body: "Think about an edge case for the /users endpoint. What should happen if required fields are missing?",
    },
    {
        title: "Review the DSL chaining",
        body: "Notice how describeAPI and itDoc combine request and response expectations. Consider additional response fields to document.",
    },
    {
        title: "OpenAPI ideas",
        body: "Consider the tags and descriptions you want to surface in the generated OpenAPI document once the run completes.",
    },
]

function formatDuration(milliseconds: number): string {
    const bounded = Math.max(0, milliseconds)
    const totalSeconds = Math.floor(bounded / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes > 0) {
        return `${minutes}m ${seconds.toString().padStart(2, "0")}s`
    }

    return `${seconds}s`
}

function createPackageJson(): string {
    const packageJson = {
        name: "itdoc-playground",
        version: "0.0.0",
        private: true,
        type: "commonjs",
        scripts: {
            test: "mocha __tests__/app.test.js --timeout 8000",
        },
        dependencies: {
            itdoc: "file:./itdoc.tgz",
            express: "^4.21.1",
            mocha: "^11.1.0",
        },
        itdoc: {
            output: "output",
            document: {
                title: "Playground API",
                description: "Generated from the interactive itdoc playground.",
                baseUrl: "http://localhost:3000",
            },
        },
    }

    return JSON.stringify(packageJson, null, 4)
}

function createProjectFiles(code: string, tests: string): FileSystemTree {
    return {
        "package.json": {
            file: {
                contents: createPackageJson(),
            },
        },
        "app.js": {
            file: {
                contents: code,
            },
        },
        __tests__: {
            directory: {
                "app.test.js": {
                    file: {
                        contents: tests,
                    },
                },
            },
        },
        output: {
            directory: {
                "oas.json": {
                    file: {
                        contents: "",
                    },
                },
            },
        },
    }
}

function formatJson(value: string): string {
    try {
        const parsed = JSON.parse(value)
        return JSON.stringify(parsed, null, 4)
    } catch {
        return value
    }
}

const FILE_READ_RETRY_ATTEMPTS = 8
const FILE_READ_RETRY_DELAY_MS = 250

async function waitFor(ms: number): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function readFileWithRetry(
    instance: WebContainerInstance,
    filePath: string,
    attempts: number = FILE_READ_RETRY_ATTEMPTS,
    delayMs: number = FILE_READ_RETRY_DELAY_MS,
): Promise<string | null> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const content = await instance.fs.readFile(filePath, "utf-8")
            return typeof content === "string" ? content : String(content)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (message.includes("ENOENT") && attempt < attempts) {
                await waitFor(delayMs)
                continue
            }
            if (message.includes("ENOENT")) {
                return null
            }
            throw error
        }
    }

    return null
}

async function provisionLocalItDocPackage(
    instance: WebContainerInstance,
    tarballUrl: string,
    log: (chunk: string) => void,
): Promise<boolean> {
    try {
        const response = await fetch(tarballUrl, { cache: "no-store" })
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const buffer = await response.arrayBuffer()
        await instance.fs.writeFile("itdoc.tgz", new Uint8Array(buffer))
        return true
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log(`\nFailed to load local itdoc build (${message}). Falling back to npm registry...\n`)
        return false
    }
}

async function switchItDocDependencyToRegistry(
    instance: WebContainerInstance,
    log: (chunk: string) => void,
): Promise<boolean> {
    try {
        const packageJsonRaw = await instance.fs.readFile("package.json", "utf-8")
        const packageJson = JSON.parse(packageJsonRaw.toString())
        packageJson.dependencies.itdoc = FALLBACK_ITDOC_VERSION
        await instance.fs.writeFile("package.json", JSON.stringify(packageJson, null, 4))
        log(`Updated package.json to use itdoc@${FALLBACK_ITDOC_VERSION} from npm registry.\n`)
        return true
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log(`\nUnable to reconfigure package.json for registry install (${message}).\n`)
        return false
    }
}

const Playground: React.FC = () => {
    const [installStatus, setInstallStatus] = useState<InstallStatus>("idle")
    const [isRunning, setIsRunning] = useState(false)
    const [expressCode, setExpressCode] = useState(initialExpressCode)
    const [testCode, setTestCode] = useState(initialTestCode)
    const [oasOutput, setOasOutput] = useState<string>("")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0)
    const [waitingTipIndex, setWaitingTipIndex] = useState(() =>
        Math.floor(Math.random() * waitingTips.length),
    )
    const [elapsedInstallMs, setElapsedInstallMs] = useState(0)

    const initialCodeRef = useRef(initialExpressCode)
    const initialTestCodeRef = useRef(initialTestCode)
    const webcontainerRef = useRef<WebContainerInstance | null>(null)
    const runningProcessRef = useRef<WebContainerProcess | null>(null)
    const terminalHostRef = useRef<HTMLDivElement | null>(null)
    const terminalRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const pendingTerminalChunksRef = useRef<string[]>([])
    const redocContainerRef = useRef<HTMLDivElement | null>(null)
    const redocScriptReadyRef = useRef<Promise<void> | null>(null)

    const textDecoder = useMemo(() => new TextDecoder(), [])
    const codeMirrorExtensions = useMemo(() => [javascript({ typescript: false, jsx: false })], [])
    const jsonCodeMirrorExtensions = useMemo(() => [javascript({ json: true })], [])
    const appendTerminalOutput = useCallback((chunk: string) => {
        if (terminalRef.current) {
            terminalRef.current.write(chunk)
        } else {
            pendingTerminalChunksRef.current.push(chunk)
        }
    }, [])
    const resetTerminal = useCallback(() => {
        pendingTerminalChunksRef.current.length = 0
        if (terminalRef.current) {
            terminalRef.current.reset()
            const fitAddon = fitAddonRef.current
            if (fitAddon) {
                try {
                    fitAddon.fit()
                } catch {
                    /* no-op */
                }
            }
        }
    }, [])

    const ensureRedocScript = useCallback((): Promise<void> => {
        if (!ExecutionEnvironment.canUseDOM) {
            return Promise.resolve()
        }

        if (window.Redoc) {
            return Promise.resolve()
        }

        if (!redocScriptReadyRef.current) {
            redocScriptReadyRef.current = new Promise<void>((resolve, reject) => {
                const script = document.createElement("script")
                script.src = REDOC_CDN_URL
                script.async = true
                script.onload = () => resolve()
                script.onerror = () => {
                    redocScriptReadyRef.current = null
                    reject(new Error("Failed to load Redoc preview."))
                }
                document.body.appendChild(script)
            })
        }

        return redocScriptReadyRef.current
    }, [])

    const pipeProcessOutput = useCallback(
        (process: WebContainerProcess) => {
            const writable = new WritableStream<string>({
                write(data) {
                    const text =
                        typeof data === "string"
                            ? data
                            : textDecoder.decode(data as unknown as Uint8Array)
                    appendTerminalOutput(text)
                },
            })

            process.output.pipeTo(writable).catch(() => undefined)
        },
        [appendTerminalOutput, textDecoder],
    )

    const canUseDom = ExecutionEnvironment.canUseDOM
    const itdocTarballUrl = useBaseUrl(itdocTarballAsset)

    useEffect(() => {
        if (!canUseDom) {
            return
        }

        const host = terminalHostRef.current
        if (!host) {
            return
        }

        const term = new Terminal({
            convertEol: true,
            disableStdin: true,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            theme: {
                background: "#0d1117",
                foreground: "#e2e8f0",
                cursor: "#e2e8f0",
            },
        })
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        terminalRef.current = term
        fitAddonRef.current = fitAddon

        term.open(host)
        try {
            fitAddon.fit()
        } catch {
            /* no-op */
        }

        if (pendingTerminalChunksRef.current.length > 0) {
            term.write(pendingTerminalChunksRef.current.join(""))
            pendingTerminalChunksRef.current.length = 0
        }

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      try {
                          fitAddon.fit()
                      } catch {
                          /* no-op */
                      }
                  })
                : null

        if (resizeObserver) {
            resizeObserver.observe(host)
        }

        const handleWindowResize = () => {
            try {
                fitAddon.fit()
            } catch {
                /* no-op */
            }
        }

        window.addEventListener("resize", handleWindowResize)

        return () => {
            window.removeEventListener("resize", handleWindowResize)
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            terminalRef.current = null
            fitAddonRef.current = null
            term.dispose()
        }
    }, [canUseDom])

    useEffect(() => {
        if (!canUseDom) {
            return
        }

        let cancelled = false
        let mountedInstance: WebContainerInstance | null = null

        const setup = async () => {
            setInstallStatus("installing")
            resetTerminal()
            appendTerminalOutput("> npm install\r\n")

            try {
                const webContainerModule = await import("@webcontainer/api")
                if (cancelled) {
                    return
                }

                const coep = window.crossOriginIsolated ? "require-corp" : "none"
                const instance = await webContainerModule.WebContainer.boot({ coep })
                mountedInstance = instance
                webcontainerRef.current = instance

                await instance.mount(
                    createProjectFiles(initialCodeRef.current, initialTestCodeRef.current),
                )
                if (cancelled) {
                    return
                }

                const tarballReady = await provisionLocalItDocPackage(
                    instance,
                    itdocTarballUrl,
                    appendTerminalOutput,
                )
                if (!tarballReady) {
                    const switched = await switchItDocDependencyToRegistry(
                        instance,
                        appendTerminalOutput,
                    )
                    if (!switched) {
                        setInstallStatus("error")
                        setErrorMessage(
                            "Failed to provision the itdoc dependency. Check the terminal output for details.",
                        )
                        return
                    }
                }

                const installProcess = await instance.spawn("npm", ["install"])
                runningProcessRef.current = installProcess
                pipeProcessOutput(installProcess)

                const exitCode = await installProcess.exit
                runningProcessRef.current = null

                if (cancelled) {
                    return
                }

                if (exitCode !== 0) {
                    setInstallStatus("error")
                    setErrorMessage(
                        "Dependency installation failed. Check the terminal output for details.",
                    )
                    return
                }

                setInstallStatus("ready")
                appendTerminalOutput(
                    "\r\nDependencies installed. Press Run to execute the tests.\r\n",
                )
            } catch (error) {
                if (!cancelled) {
                    const baseMessage = error instanceof Error ? error.message : String(error)
                    const isolationHint = window.crossOriginIsolated
                        ? ""
                        : "\nThis browser session is not cross-origin isolated. Configure the host to send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, or open the docs in a Chromium browser where `SharedArrayBuffer` is enabled."
                    setInstallStatus("error")
                    setErrorMessage(`${baseMessage}${isolationHint}`)
                }
            }
        }

        setup()

        return () => {
            cancelled = true
            const activeProcess = runningProcessRef.current
            if (activeProcess) {
                void activeProcess.kill().catch(() => undefined)
            }
            runningProcessRef.current = null

            if (mountedInstance) {
                void mountedInstance.teardown()
            }

            webcontainerRef.current = null
        }
    }, [appendTerminalOutput, canUseDom, itdocTarballUrl, pipeProcessOutput, resetTerminal])

    useEffect(() => {
        if (!canUseDom) {
            return
        }

        if (!oasOutput) {
            if (redocContainerRef.current) {
                redocContainerRef.current.innerHTML = ""
            }
            return
        }

        let cancelled = false

        const renderPreview = async () => {
            let parsedSpec: unknown
            try {
                parsedSpec = JSON.parse(oasOutput)
            } catch (error) {
                setErrorMessage(
                    "OpenAPI document is not valid JSON. Check the generated output before previewing.",
                )
                return
            }

            try {
                await ensureRedocScript()
            } catch (error) {
                if (!cancelled) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to load the Redoc preview resources."
                    setErrorMessage(message)
                }
                return
            }

            if (cancelled || !redocContainerRef.current || !window.Redoc) {
                return
            }

            redocContainerRef.current.innerHTML = ""
            window.Redoc.init(
                parsedSpec,
                { hideDownloadButton: true, scrollYOffset: 0 },
                redocContainerRef.current,
            )
        }

        renderPreview()

        return () => {
            cancelled = true
        }
    }, [canUseDom, ensureRedocScript, oasOutput])

    const runDisabled = installStatus !== "ready" || isRunning

    const statusLabel = useMemo(() => {
        switch (installStatus) {
            case "installing":
                return "Installing dependencies..."
            case "ready":
                return "Environment ready."
            case "error":
                return "Environment failed to start."
            default:
                return "Waiting to start..."
        }
    }, [installStatus])

    const handleRun = async () => {
        if (runDisabled || !webcontainerRef.current) {
            return
        }

        setIsRunning(true)
        setErrorMessage(null)
        setOasOutput("")
        resetTerminal()
        appendTerminalOutput("> npm test\r\n")

        const instance = webcontainerRef.current

        try {
            await instance.fs.writeFile("app.js", expressCode)
            await instance.fs.writeFile("__tests__/app.test.js", testCode)

            const testProcess = await instance.spawn("npm", ["test"])
            runningProcessRef.current = testProcess
            pipeProcessOutput(testProcess)

            const exitCode = await testProcess.exit
            runningProcessRef.current = null

            if (exitCode !== 0) {
                setErrorMessage(
                    "Tests failed. Review the terminal output for assertions and stack traces.",
                )
                return
            }

            const oas = await readFileWithRetry(instance, "output/oas.json")
            if (!oas) {
                setErrorMessage(
                    "OpenAPI document was not generated. Confirm your tests exercise the itdoc DSL and review the terminal logs.",
                )
                return
            }
            setOasOutput(formatJson(oas))
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : String(error))
        } finally {
            setIsRunning(false)
        }
    }

    if (!canUseDom) {
        return (
            <div className={styles.container}>
                <p>The interactive playground is only available in the browser.</p>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button className={styles.runButton} onClick={handleRun} disabled={runDisabled}>
                    {isRunning ? "Running..." : "Run"}
                </button>
                <span className={styles.statusLabel}>{statusLabel}</span>
            </div>
            {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
            <div className={styles.workspace}>
                <section className={`${styles.panel} ${styles.expressPanel}`}>
                    <div className={styles.panelHeader}>
                        <span>Express App (edit and run)</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirror
                            value={expressCode}
                            height="320px"
                            extensions={codeMirrorExtensions}
                            theme={oneDark}
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLine: true,
                                highlightActiveLineGutter: true,
                            }}
                            onChange={(value) => setExpressCode(value)}
                            className={styles.codeEditor}
                        />
                        <p className={styles.hint}>
                            Tip: adjust the handlers above, then run the tests to regenerate the
                            OpenAPI schema.
                        </p>
                    </div>
                </section>
                <section className={`${styles.panel} ${styles.testsPanel}`}>
                    <div className={styles.panelHeader}>
                        <span>itdoc Test Suite</span>
                    </div>
                    <div className={styles.editorWrapper}>
                        <CodeMirror
                            value={testCode}
                            height="320px"
                            extensions={codeMirrorExtensions}
                            theme={oneDark}
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLine: true,
                                highlightActiveLineGutter: true,
                            }}
                            onChange={(value) => setTestCode(value)}
                            className={styles.codeEditor}
                        />
                        <p className={styles.hint}>
                            Tip: align the assertions here with any changes you make to the Express
                            handlers.
                        </p>
                    </div>
                </section>
                <section className={`${styles.panel} ${styles.terminalPanel}`}>
                    <div className={styles.panelHeader}>
                        <span>Terminal</span>
                    </div>
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
                </section>
                <section className={`${styles.panel} ${styles.oasPanel}`}>
                    <div className={styles.panelHeader}>
                        <span>OpenAPI Output</span>
                    </div>
                    <div className={styles.oasWorkspace}>
                        <div className={`${styles.codeSurface} ${styles.oasEditorCard}`}>
                            <div className={styles.codeChrome}>oas.json</div>
                            <div className={styles.oasEditorSurface}>
                                {oasOutput ? (
                                    <CodeMirror
                                        value={oasOutput}
                                        height="100%"
                                        extensions={jsonCodeMirrorExtensions}
                                        theme={oneDark}
                                        editable={false}
                                        basicSetup={{
                                            lineNumbers: true,
                                            highlightActiveLine: false,
                                            highlightActiveLineGutter: false,
                                        }}
                                        className={styles.codeEditor}
                                    />
                                ) : (
                                    <p className={styles.oasEmpty}>
                                        Run the tests to generate the OpenAPI document.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={`${styles.codeSurface} ${styles.oasPreviewCard}`}>
                            <div className={styles.codeChrome}>Swagger Preview</div>
                            <div className={styles.oasPreviewContainer}>
                                {oasOutput ? (
                                    <div
                                        ref={redocContainerRef}
                                        className={styles.oasPreviewCanvas}
                                    >
                                        Loading preview…
                                    </div>
                                ) : (
                                    <p className={styles.oasEmpty}>
                                        Preview will appear here after a successful run.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Playground
