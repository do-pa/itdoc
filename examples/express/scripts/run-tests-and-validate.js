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

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const deepEqual = require("fast-deep-equal")

const OUTPUT_DIR = path.join(__dirname, "../output")
const EXPECT_OAS_DIR = path.join(__dirname, "../expected")
const OUTPUT_FILENAME = "oas.json"

const cleanOutputDir = () => {
    if (fs.existsSync(OUTPUT_DIR)) {
        console.log("🧹 Removing old output folder...")
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
    }
}

const verifyOasOutput = () => {
    const actualOasPath = path.join(OUTPUT_DIR, OUTPUT_FILENAME)
    const expectedOasPath = path.join(EXPECT_OAS_DIR, OUTPUT_FILENAME)

    if (!fs.existsSync(actualOasPath)) {
        throw new Error(`❌ Generated ${OUTPUT_FILENAME} not found!`)
    }

    if (!fs.existsSync(expectedOasPath)) {
        throw new Error(`❌ Expected ${OUTPUT_FILENAME} not found!`)
    }

    const actual = JSON.parse(fs.readFileSync(actualOasPath, "utf8"))
    const expected = JSON.parse(fs.readFileSync(expectedOasPath, "utf8"))

    if (!deepEqual(actual, expected)) {
        console.error(`❌ ${OUTPUT_FILENAME} does not match the expected output!`)
        process.exit(1)
    }

    console.log("✅ OAS output matches the expected output!")
}

const runAndVerifyOas = (cmd) => {
    try {
        cleanOutputDir()
        console.log(`\n▶ Running: ${cmd}`)
        execSync(cmd, {
            stdio: "inherit",
            env: { ...process.env, ITDOC_DEBUG: "true" },
        })
        verifyOasOutput()
    } catch (error) {
        console.error(`❌ Command failed: ${cmd}`)
        console.error(error.message || error)
        process.exit(1)
    }
}

// RUN
runAndVerifyOas("pnpm test:jest")
runAndVerifyOas("pnpm test:mocha")
