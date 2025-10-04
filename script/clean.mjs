#!/usr/bin/env node
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
import { rm } from "fs/promises"
import { resolve } from "path"

/**
 * The script that clean up build directory.
 */
async function main() {
    const target = resolve(process.cwd(), "build")

    try {
        await rm(target, { recursive: true, force: true })
    } catch (error) {
        console.error(`[clean] failed to remove ${target}:`, error)
        process.exitCode = 1
    }
}

void main()
