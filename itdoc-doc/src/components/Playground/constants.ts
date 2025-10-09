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

import type {
    ExplorerNode,
    PlaygroundFileDefinition,
    PlaygroundFileId,
    PlaygroundFileMap,
} from "./types"

export const ITDOC_TARBALL_ASSET = "/playground/itdoc.tgz"
export const FALLBACK_ITDOC_VERSION = "^0.4.1"

export const initialExpressCode = `const express = require("express")

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

export const initialTestCode = `const { describeAPI, itDoc, HttpMethod, HttpStatus, field } = require("itdoc")
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

export const installMilestones = [
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

export const waitingTips = [
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

const fileDefinitions: PlaygroundFileMap = {
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
        description: "Mocha scenario powered by itdoc",
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

export const PLAYGROUND_FILES: PlaygroundFileMap = fileDefinitions

export const EXPLORER_NODES: ExplorerNode[] = [
    { type: "file", fileId: "app", label: "app.js" },
    { type: "file", fileId: "package", label: "package.json" },
    {
        type: "folder",
        label: "__tests__",
        children: [{ type: "file", fileId: "test", label: "app.test.js" }],
    },
]

export function resolveFileDefinition(fileId: PlaygroundFileId): PlaygroundFileDefinition {
    return PLAYGROUND_FILES[fileId]
}
