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
import Editor, { OnMount } from "@monaco-editor/react"
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
const swaggerPreviewTitleId = "playground-swagger-preview-title"
const runModalTitleId = "playground-run-modal-title"

interface PlaygroundProps {
    onRequestHelp?: () => void
}

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
        title: "Fetching itdoc",
        description: "Fetching the latest version of the itdoc library.",
    },
    {
        title: "Installing npm dependencies",
        description:
            "Downloading the dependencies required for using itdoc, such as express and mocha.",
    },
    {
        title: "Finalizing workspace",
        description:
            "Wiring up editors, terminal, and previews so you can start tweaking the Express app and tests.",
    },
]

const waitingTips = [
    {
        title: "Origin of the name itdoc",
        body: "The name 'itdoc' comes from the typical testing pattern describe()... it()... meaning 'documentation (doc) generated from test cases (it)'.",
    },
    {
        title: "Did you know?",
        body: "The itdoc mascot logo was actually created using generative AI. :grin:",
    },
    {
        title: "How to run itdoc tests",
        body: "You can execute itdoc tests with Mocha or Jest from the CLI. API documentation is generated automatically based on the test results—no extra configuration needed.",
    },
]

type PlaygroundFileId = "app" | "test" | "package"

interface PlaygroundFileDefinition {
    id: PlaygroundFileId
    label: string
    path: string
    description: string
    language: "javascript" | "json"
    monacoUri: string
    editable: boolean
}

interface ExplorerFileNode {
    type: "file"
    fileId: PlaygroundFileId
    label: string
    depth: number
}

interface ExplorerFolderNode {
    type: "folder"
    label: string
    depth: number
    children: ExplorerFileNode[]
}

type ExplorerNode = ExplorerFileNode | ExplorerFolderNode

const PLAYGROUND_FILES: Record<PlaygroundFileId, PlaygroundFileDefinition> = {
    app: {
        id: "app",
        label: "app.js",
        path: "app.js",
        description: "Express entry point",
        language: "javascript",
        monacoUri: "file:///app.js",
        editable: true,
    },
    test: {
        id: "test",
        label: "app.test.js",
        path: "__tests__/app.test.js",
        description: "Test code with itdoc",
        language: "javascript",
        monacoUri: "file:///__tests__/app.test.js",
        editable: true,
    },
    package: {
        id: "package",
        label: "package.json",
        path: "package.json",
        description: "Playground dependencies and scripts",
        language: "json",
        monacoUri: "file:///package.json",
        editable: false,
    },
}

const EXPLORER_NODES: ExplorerNode[] = [
    { type: "file", fileId: "app", label: "app.js", depth: 0 },
    { type: "file", fileId: "package", label: "package.json", depth: 0 },
    {
        type: "folder",
        label: "__tests__",
        depth: 0,
        children: [{ type: "file", fileId: "test", label: "app.test.js", depth: 1 }],
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
    const itdocTarballUrl = useBaseUrl(itdocTarballAsset)

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
            <header className={styles.commandBar}>
                <div className={styles.commandContext}>
                    <p className={styles.commandTitle}>itdoc playground</p>
                    {activeFile ? (
                        <div className={styles.commandMeta}>
                            <span className={styles.commandMetaLabel}>Editing</span>
                            <span className={styles.commandPath}>{activeFile.path}</span>
                            <span className={styles.commandDescription}>
                                {activeFile.description}
                            </span>
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
                        onClick={handleRun}
                        disabled={runDisabled}
                    >
                        {isRunning ? "Running..." : "Run"}
                    </button>
                </div>
            </header>
            {showWorkspace && errorMessage ? (
                <div className={styles.inlineAlert} role="alert">
                    <strong>Test run failed.</strong>
                    {errorMessage}
                </div>
            ) : null}
            <main className={styles.workspaceMain}>
                {showWorkspace ? (
                    <div className={styles.workspaceInner}>
                        <aside className={styles.explorer}>
                            <div className={styles.explorerHeader}>Explorer</div>
                            <nav aria-label="Playground files" className={styles.tree}>
                                <div className={styles.treeRoot} aria-hidden="true">
                                    /
                                </div>
                                {EXPLORER_NODES.map((node) => {
                                    if (node.type === "folder") {
                                        return (
                                            <div className={styles.treeFolder} key={node.label}>
                                                <div className={styles.treeFolderLabel}>
                                                    <span
                                                        className={`${styles.treeIcon} ${styles.treeIconFolder}`}
                                                        aria-hidden="true"
                                                    />
                                                    {node.label}
                                                </div>
                                                <div className={styles.treeChildren}>
                                                    {node.children.map((child) => {
                                                        const file = PLAYGROUND_FILES[child.fileId]
                                                        const isActive =
                                                            activeFileId === child.fileId
                                                        const isOpen = openFiles.includes(
                                                            child.fileId,
                                                        )
                                                        return (
                                                            <button
                                                                key={child.fileId}
                                                                type="button"
                                                                className={`${styles.treeItem} ${
                                                                    isActive
                                                                        ? styles.treeItemActive
                                                                        : ""
                                                                } ${isOpen ? styles.treeItemOpen : ""}`}
                                                                onClick={() =>
                                                                    handleSelectFile(child.fileId)
                                                                }
                                                                aria-current={
                                                                    isActive ? true : undefined
                                                                }
                                                            >
                                                                <span
                                                                    className={`${styles.treeIcon} ${styles.treeIconFile}`}
                                                                    aria-hidden="true"
                                                                />
                                                                <span className={styles.treeLabel}>
                                                                    {file.label}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    }

                                    const file = PLAYGROUND_FILES[node.fileId]
                                    const isActive = activeFileId === node.fileId
                                    const isOpen = openFiles.includes(node.fileId)

                                    return (
                                        <button
                                            key={node.fileId}
                                            type="button"
                                            className={`${styles.treeItem} ${
                                                isActive ? styles.treeItemActive : ""
                                            } ${isOpen ? styles.treeItemOpen : ""}`}
                                            onClick={() => handleSelectFile(node.fileId)}
                                            aria-current={isActive ? true : undefined}
                                        >
                                            <span
                                                className={`${styles.treeIcon} ${styles.treeIconFile}`}
                                                aria-hidden="true"
                                            />
                                            <span className={styles.treeLabel}>{file.label}</span>
                                        </button>
                                    )
                                })}
                            </nav>
                        </aside>
                        <section className={styles.editorPane}>
                            <div className={styles.tabBar} role="tablist">
                                {openFiles.map((fileId) => {
                                    const file = PLAYGROUND_FILES[fileId]
                                    const isActive = activeFileId === fileId
                                    const tabId = `editor-tab-${file.id}`
                                    const panelId = `editor-panel-${file.id}`
                                    return (
                                        <div
                                            key={fileId}
                                            className={`${styles.tabItem} ${
                                                isActive ? styles.tabItemActive : ""
                                            }`}
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
                                                onClick={() => handleSelectFile(fileId)}
                                            >
                                                {file.label}
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.tabClose}
                                                onClick={() => handleCloseTab(fileId)}
                                                aria-label={`Close ${file.label}`}
                                                disabled={openFiles.length <= 1}
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
                                aria-labelledby={
                                    activeFile ? `editor-tab-${activeFile.id}` : undefined
                                }
                                tabIndex={activeFile ? 0 : -1}
                            >
                                {activeFile ? (
                                    <Editor
                                        key={activeFile.id}
                                        value={activeFileValue}
                                        language={activeFile.language}
                                        path={activeFile.monacoUri}
                                        onMount={handleEditorMount}
                                        onChange={handleEditorChange}
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
                                    Tip: Keep the Express app and itdoc tests aligned before you run
                                    the suite.
                                </p>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className={styles.workspacePlaceholder}>
                        <p className={styles.placeholderTitle}>Booting your sandbox…</p>
                        <p className={styles.placeholderCopy}>
                            WebContainer is preparing the environment. Dependencies install
                            automatically the first time the playground loads.
                        </p>
                        {waitingTip ? (
                            <aside className={styles.tipCard}>
                                <div className={styles.tipHeader}>
                                    <span className={styles.tipLabel}>While you wait</span>
                                    <button
                                        type="button"
                                        className={styles.tipButton}
                                        onClick={handleNextTip}
                                    >
                                        Show another idea
                                    </button>
                                </div>
                                <p className={styles.tipTitle}>{waitingTip.title}</p>
                                <p className={styles.tipBody}>{waitingTip.body}</p>
                            </aside>
                        ) : null}
                    </div>
                )}
            </main>
            {showRunModal ? (
                <div
                    className={styles.runModalBackdrop}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={runModalTitleId}
                    onClick={() => setShowRunModal(false)}
                >
                    <div className={styles.runModal} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.runModalHeader}>
                            <div className={styles.runModalHeadingGroup}>
                                <h2 id={runModalTitleId}>Run output</h2>
                                <span className={styles.runModalStatus}>{dockStatusMessage}</span>
                            </div>
                            <button
                                type="button"
                                className={styles.runModalClose}
                                onClick={() => setShowRunModal(false)}
                            >
                                Close
                            </button>
                        </div>
                        <div className={styles.runModalBody}>
                            <section className={styles.runModalColumn}>
                                <div className={styles.runModalCard}>
                                    <div className={styles.runModalCardHeader}>
                                        <h3 className={styles.runModalCardTitle}>Terminal</h3>
                                        <span className={styles.runModalChip}>
                                            {dockStatusMessage}
                                        </span>
                                    </div>
                                    <div className={styles.runModalCardBody}>
                                        <div className={styles.terminalShell}>
                                            <div className={styles.terminalChrome}>
                                                <span
                                                    className={`${styles.terminalDot} ${styles.dotRed}`}
                                                />
                                                <span
                                                    className={`${styles.terminalDot} ${styles.dotYellow}`}
                                                />
                                                <span
                                                    className={`${styles.terminalDot} ${styles.dotGreen}`}
                                                />
                                            </div>
                                            <div className={styles.terminalOutput}>
                                                <div
                                                    ref={terminalHostRef}
                                                    className={styles.terminalViewport}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section className={styles.runModalColumn}>
                                <div className={styles.runModalCard}>
                                    <div className={styles.runModalCardHeader}>
                                        <h3 className={styles.runModalCardTitle}>
                                            Generated docs by itdoc
                                        </h3>
                                        <button
                                            type="button"
                                            className={styles.previewLaunchButton}
                                            onClick={() => setShowSwaggerPreview(true)}
                                            disabled={!oasOutput}
                                        >
                                            Fullscreen preview
                                        </button>
                                    </div>
                                    <div className={styles.runModalCardBody}>
                                        <div className={styles.oasWorkspace}>
                                            <div
                                                className={`${styles.codeSurface} ${styles.oasEditorCard}`}
                                            >
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
                                                            Run the tests to generate the OpenAPI
                                                            document.
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
            ) : null}
            {showOverlay ? (
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
                                        <p className={styles.progressLabel}>
                                            Setting up your workspace
                                        </p>
                                        <p className={styles.progressTitle}>
                                            {currentMilestone.title}
                                        </p>
                                    </div>
                                </div>
                                <span className={styles.progressPercent}>{progressPercent}%</span>
                            </div>
                            <div className={styles.installBody}>
                                <div className={styles.installTimeline}>
                                    <p className={styles.progressDescription}>
                                        {currentMilestone.description}
                                    </p>
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
                                        {installMilestones.map((milestone, index) => {
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
                                                    <span
                                                        className={styles.milestoneBullet}
                                                        aria-hidden="true"
                                                    />
                                                    <span className={styles.milestoneLabel}>
                                                        {milestone.title}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                    <div className={styles.elapsedTimer}>
                                        Elapsed: {formattedElapsed}
                                    </div>
                                    {showFinalizingHint ? (
                                        <p className={styles.finalizingHint}>
                                            Almost there—WebContainer is preparing the editors and
                                            terminal. This final step can take up to a minute the
                                            first time the sandbox boots.
                                        </p>
                                    ) : null}
                                </div>
                                {waitingTip ? (
                                    <aside className={styles.tipCard}>
                                        <div className={styles.tipHeader}>
                                            <span className={styles.tipLabel}>While you wait</span>
                                            <button
                                                type="button"
                                                className={styles.tipButton}
                                                onClick={handleNextTip}
                                            >
                                                Show another idea
                                            </button>
                                        </div>
                                        <p className={styles.tipTitle}>{waitingTip.title}</p>
                                        <p className={styles.tipBody}>{waitingTip.body}</p>
                                    </aside>
                                ) : null}
                            </div>
                        </section>
                    ) : installStatus === "error" ? (
                        <div className={styles.installErrorCard}>
                            <h2>Environment failed to start</h2>
                            <p>{errorMessage ?? "An unexpected error occurred during setup."}</p>
                            <p className={styles.installErrorHint}>
                                Refresh the page to try again or verify your browser supports
                                WebContainer.
                            </p>
                        </div>
                    ) : null}
                </div>
            ) : null}
            {showSwaggerPreview ? (
                <div
                    className={styles.previewModalBackdrop}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={swaggerPreviewTitleId}
                    onClick={() => setShowSwaggerPreview(false)}
                >
                    <div
                        className={styles.previewModal}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.previewModalHeader}>
                            <h2 id={swaggerPreviewTitleId}>Swagger Preview</h2>
                            <button
                                type="button"
                                className={styles.previewModalClose}
                                onClick={() => setShowSwaggerPreview(false)}
                            >
                                Close
                            </button>
                        </div>
                        <div className={styles.previewModalBody}>
                            {oasOutput ? (
                                <div ref={redocContainerRef} className={styles.previewModalCanvas}>
                                    Loading preview…
                                </div>
                            ) : (
                                <p className={styles.previewModalEmpty}>
                                    Run the tests to generate the OpenAPI document before opening
                                    the preview.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default Playground
