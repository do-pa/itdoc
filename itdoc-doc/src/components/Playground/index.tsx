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
import type { OnMount } from "@monaco-editor/react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

import FileExplorer from "./FileExplorer"
import InstallOverlay from "./InstallOverlay"
import EditorTabs from "./EditorTabs"
import RunModal from "./RunModal"
import SwaggerPreview from "./SwaggerPreview"
import TopBar from "./TopBar"
import WorkspacePlaceholder from "./WorkspacePlaceholder"
import {
    EXPLORER_NODES,
    ITDOC_TARBALL_ASSET,
    PLAYGROUND_FILES,
    initialExpressCode,
    initialTestCode,
    installMilestones,
    waitingTips,
} from "./constants"
import styles from "./styles.module.css"
import type { InstallStatus, PlaygroundFileId } from "./types"

type FileSystemTree = import("@webcontainer/api").FileSystemTree
type WebContainerInstance = import("@webcontainer/api").WebContainer
type WebContainerProcess = import("@webcontainer/api").Process

declare global {
    interface Window {
        Redoc?: {
            init: (spec: unknown, options: Record<string, unknown>, element: HTMLElement) => void
        }
    }
}

const REDOC_CDN_URL = "https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
const swaggerPreviewTitleId = "playground-swagger-preview-title"
const runModalTitleId = "playground-run-modal-title"

interface PlaygroundProps {
    onRequestHelp?: () => void
}

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

function createProjectFiles(code: string, tests: string, packageJson: string): FileSystemTree {
    return {
        "package.json": {
            file: {
                contents: packageJson,
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

const Playground: React.FC<PlaygroundProps> = ({ onRequestHelp }) => {
    const [installStatus, setInstallStatus] = useState<InstallStatus>("idle")
    const [isRunning, setIsRunning] = useState(false)
    const [expressCode, setExpressCode] = useState(initialExpressCode)
    const [testCode, setTestCode] = useState(initialTestCode)
    const [oasOutput, setOasOutput] = useState<string>("")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0)
    const [waitingTipIndex, setWaitingTipIndex] = useState(() =>
        waitingTips.length > 0 ? Math.floor(Math.random() * waitingTips.length) : 0,
    )
    const [elapsedInstallMs, setElapsedInstallMs] = useState(0)
    const [showSwaggerPreview, setShowSwaggerPreview] = useState(false)
    const [showRunModal, setShowRunModal] = useState(false)
    const [openFiles, setOpenFiles] = useState<PlaygroundFileId[]>(["app"])
    const [activeFileId, setActiveFileId] = useState<PlaygroundFileId>("app")

    const initialCodeRef = useRef(initialExpressCode)
    const initialTestCodeRef = useRef(initialTestCode)
    const packageJsonRef = useRef<string>(createPackageJson())
    const webcontainerRef = useRef<WebContainerInstance | null>(null)
    const runningProcessRef = useRef<WebContainerProcess | null>(null)
    const terminalHostRef = useRef<HTMLDivElement | null>(null)
    const terminalRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const pendingTerminalChunksRef = useRef<string[]>([])
    const redocContainerRef = useRef<HTMLDivElement | null>(null)
    const redocScriptReadyRef = useRef<Promise<void> | null>(null)
    const didAutofocusEditorRef = useRef(false)

    const textDecoder = useMemo(() => new TextDecoder(), [])
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

    const activeFile = PLAYGROUND_FILES[activeFileId]
    const activeFileValue = useMemo(() => {
        switch (activeFileId) {
            case "app":
                return expressCode
            case "test":
                return testCode
            case "package":
            default:
                return packageJsonRef.current
        }
    }, [activeFileId, expressCode, testCode])

    const handleSelectFile = useCallback((fileId: PlaygroundFileId) => {
        setActiveFileId(fileId)
        setOpenFiles((files) => (files.includes(fileId) ? files : [...files, fileId]))
    }, [])

    const handleCloseTab = useCallback(
        (fileId: PlaygroundFileId) => {
            setOpenFiles((files) => {
                if (files.length <= 1 || !files.includes(fileId)) {
                    return files
                }

                const closingIndex = files.indexOf(fileId)
                const nextFiles = files.filter((id) => id !== fileId)

                if (fileId === activeFileId) {
                    const fallbackIndex = closingIndex > 0 ? closingIndex - 1 : 0
                    const fallbackFile = nextFiles[fallbackIndex] ?? nextFiles[0]
                    if (fallbackFile) {
                        setActiveFileId(fallbackFile)
                    }
                }

                return nextFiles
            })
        },
        [activeFileId],
    )

    const handleEditorChange = useCallback(
        (value: string | undefined) => {
            if (!activeFile || !activeFile.editable) {
                return
            }

            const nextValue = value ?? ""

            if (activeFile.id === "app") {
                setExpressCode(nextValue)
            } else if (activeFile.id === "test") {
                setTestCode(nextValue)
            }
        },
        [activeFile],
    )

    const handleEditorMount = useCallback<OnMount>((editor) => {
        if (!didAutofocusEditorRef.current) {
            editor.focus()
            didAutofocusEditorRef.current = true
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
    const itdocTarballUrl = useBaseUrl(ITDOC_TARBALL_ASSET)

    useEffect(() => {
        if (!canUseDom || !showRunModal) {
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
    }, [appendTerminalOutput, canUseDom, showRunModal])

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
                    createProjectFiles(
                        initialCodeRef.current,
                        initialTestCodeRef.current,
                        packageJsonRef.current,
                    ),
                )
                if (cancelled) {
                    return
                }

                await provisionLocalItDocPackage(instance, itdocTarballUrl, appendTerminalOutput)

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

        if (!oasOutput || (!showSwaggerPreview && !showRunModal)) {
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
    }, [canUseDom, ensureRedocScript, oasOutput, showRunModal, showSwaggerPreview])

    useEffect(() => {
        if (!canUseDom || installStatus !== "installing" || installMilestones.length === 0) {
            return
        }

        setActiveMilestoneIndex(0)
        setElapsedInstallMs(0)
        if (waitingTips.length > 0) {
            setWaitingTipIndex(Math.floor(Math.random() * waitingTips.length))
        }

        let milestoneProgress = 0
        const totalMilestones = installMilestones.length

        const milestoneInterval = window.setInterval(() => {
            milestoneProgress = Math.min(milestoneProgress + 1, totalMilestones - 1)
            setActiveMilestoneIndex(milestoneProgress)
            if (milestoneProgress >= totalMilestones - 1) {
                window.clearInterval(milestoneInterval)
            }
        }, 6000)

        const elapsedInterval = window.setInterval(() => {
            setElapsedInstallMs((previous) => previous + 1000)
        }, 1000)

        return () => {
            window.clearInterval(milestoneInterval)
            window.clearInterval(elapsedInterval)
        }
    }, [canUseDom, installStatus])

    useEffect(() => {
        if (installStatus === "ready" && installMilestones.length > 0) {
            setActiveMilestoneIndex(installMilestones.length - 1)
        }
    }, [installStatus])

    useEffect(() => {
        if (!canUseDom) {
            return
        }

        if (!showRunModal && !showSwaggerPreview) {
            return
        }

        const { style } = document.body
        const originalOverflow = style.overflow
        style.overflow = "hidden"

        return () => {
            style.overflow = originalOverflow
        }
    }, [canUseDom, showRunModal, showSwaggerPreview])

    const runDisabled = installStatus !== "ready" || isRunning

    const progressPercent = useMemo(() => {
        const milestoneCount = installMilestones.length
        if (milestoneCount <= 1) {
            return installStatus === "ready" ? 100 : 99
        }

        const clampedIndex = Math.min(activeMilestoneIndex, milestoneCount - 1)
        const percent = Math.round((clampedIndex / (milestoneCount - 1)) * 100)

        if (installStatus === "ready") {
            return 100
        }

        return Math.min(percent, 99)
    }, [activeMilestoneIndex, installStatus])

    const statusLabel = useMemo(() => {
        switch (installStatus) {
            case "installing":
                return progressPercent >= 90
                    ? "Finalizing environment..."
                    : "Installing dependencies..."
            case "ready":
                return "Environment ready."
            case "error":
                return "Environment failed to start."
            default:
                return "Waiting to start..."
        }
    }, [installStatus, progressPercent])

    const currentMilestone = useMemo(() => {
        if (installMilestones.length === 0) {
            return null
        }

        const clampedIndex = Math.min(activeMilestoneIndex, installMilestones.length - 1)
        return installMilestones[clampedIndex]
    }, [activeMilestoneIndex])

    const formattedElapsed = useMemo(() => formatDuration(elapsedInstallMs), [elapsedInstallMs])

    const waitingTip = useMemo(() => {
        if (waitingTips.length === 0) {
            return null
        }

        const normalizedIndex =
            ((waitingTipIndex % waitingTips.length) + waitingTips.length) % waitingTips.length
        return waitingTips[normalizedIndex]
    }, [waitingTipIndex])

    const showFinalizingHint = installStatus === "installing" && progressPercent >= 90

    const dockStatusMessage = useMemo(() => {
        if (isRunning) {
            return "npm test (running)"
        }

        switch (installStatus) {
            case "installing":
                return "npm install"
            case "ready":
                return "Environment ready"
            case "error":
                return "Environment failed to start"
            default:
                return statusLabel
        }
    }, [installStatus, isRunning, statusLabel])

    const handleNextTip = useCallback(() => {
        if (waitingTips.length > 0) {
            setWaitingTipIndex((index) => index + 1)
        }
    }, [])

    const handleRun = async () => {
        if (runDisabled || !webcontainerRef.current) {
            return
        }

        setIsRunning(true)
        setShowRunModal(true)
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
            <div className={styles.appShell}>
                <p className={styles.browserOnly}>
                    The interactive playground is only available in the browser.
                </p>
            </div>
        )
    }

    const showWorkspace = installStatus === "ready"
    const isInstalling = installStatus === "installing"
    const showOverlay = isInstalling || installStatus === "error"

    return (
        <div className={styles.appShell}>
            <TopBar
                installStatus={installStatus}
                statusLabel={statusLabel}
                isRunning={isRunning}
                runDisabled={runDisabled}
                onRun={handleRun}
                onRequestHelp={onRequestHelp}
                activeFile={activeFile ?? null}
            />
            {showWorkspace && errorMessage ? (
                <div className={styles.inlineAlert} role="alert">
                    <strong>Test run failed.</strong>
                    {errorMessage}
                </div>
            ) : null}
            <main className={styles.workspaceMain}>
                {showWorkspace ? (
                    <div className={styles.workspaceInner}>
                        <FileExplorer
                            nodes={EXPLORER_NODES}
                            files={PLAYGROUND_FILES}
                            activeFileId={activeFileId}
                            openFiles={openFiles}
                            onSelectFile={handleSelectFile}
                        />
                        <EditorTabs
                            files={PLAYGROUND_FILES}
                            openFiles={openFiles}
                            activeFileId={activeFileId}
                            onSelectFile={handleSelectFile}
                            onCloseTab={handleCloseTab}
                            onEditorChange={handleEditorChange}
                            onEditorMount={handleEditorMount}
                            activeFileValue={activeFileValue}
                            oasOutput={oasOutput}
                            onOpenPreview={() => setShowSwaggerPreview(true)}
                            canCloseTabs={openFiles.length > 1}
                        />
                    </div>
                ) : (
                    <WorkspacePlaceholder
                        tipTitle={waitingTip?.title}
                        tipBody={waitingTip?.body}
                        onNextTip={handleNextTip}
                    />
                )}
            </main>
            <RunModal
                isOpen={showRunModal}
                titleId={runModalTitleId}
                dockStatusMessage={dockStatusMessage}
                onClose={() => setShowRunModal(false)}
                terminalHostRef={terminalHostRef}
                oasOutput={oasOutput}
                onOpenPreview={() => setShowSwaggerPreview(true)}
            />
            <SwaggerPreview
                isOpen={showSwaggerPreview}
                titleId={swaggerPreviewTitleId}
                onClose={() => setShowSwaggerPreview(false)}
                redocContainerRef={redocContainerRef}
                hasDocument={Boolean(oasOutput)}
            />
            <InstallOverlay
                isVisible={showOverlay}
                isInstalling={isInstalling}
                installStatus={installStatus}
                currentMilestone={currentMilestone}
                milestones={installMilestones}
                activeMilestoneIndex={activeMilestoneIndex}
                progressPercent={progressPercent}
                formattedElapsed={formattedElapsed}
                showFinalizingHint={showFinalizingHint}
                waitingTipTitle={waitingTip?.title}
                waitingTipBody={waitingTip?.body}
                onNextTip={handleNextTip}
                errorMessage={errorMessage}
            />
        </div>
    )
}

export default Playground
