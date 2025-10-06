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

import { expect } from "chai"
import * as sinon from "sinon"
import chalk from "chalk"
import logger from "../../../config/logger"

describe("logger", () => {
    let consoleStub: sinon.SinonStub

    beforeEach(() => {
        consoleStub = sinon.stub(console, "log")
    })

    afterEach(() => {
        consoleStub.restore()
    })

    context("when info is called", () => {
        it("prints formatted logs", () => {
            logger.info(
                "User sign-up succeeded",
                {
                    username: "penekhun",
                    name: "MoonSeonghun",
                },
                "Joined at: 2025-01-01",
            )

            const [labelLine, ...extraLines] = consoleStub.getCalls().map((c) => c.args[0])

            expect(labelLine).to.equal(
                chalk.bgBlue(chalk.white.bold("[INFO]")) +
                    "  " +
                    chalk.blue("User sign-up succeeded"),
            )

            expect(extraLines).to.deep.equal([
                "       ↳ {\n" +
                    '         "username": "penekhun",\n' +
                    '         "name": "MoonSeonghun"\n' +
                    "       }",
                "       ↳ Joined at: 2025-01-01",
            ])
        })
    })

    context("when ITDOC_DEBUG is toggled", () => {
        it("sets the log level to 4 when the variable is unset", async () => {
            delete process.env.ITDOC_DEBUG
            const { default: logger } = await import("../../../config/logger?" + Date.now())
            expect(logger.level).to.equal(4)
        })

        it("sets the log level to 0 when the variable is enabled", async () => {
            process.env.ITDOC_DEBUG = "true"
            const { default: logger } = await import("../../../config/logger?" + Date.now())
            expect(logger.level).to.equal(0)
            delete process.env.ITDOC_DEBUG
        })
    })
})
