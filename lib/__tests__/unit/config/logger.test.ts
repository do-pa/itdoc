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

    context("info 호출시", () => {
        it("로그가 잘 출력된다.", () => {
            logger.info(
                "회원 가입 성공",
                {
                    username: "penekhun",
                    name: "MoonSeonghun",
                },
                "가입 시기 : 2025-01-01",
            )

            const [labelLine, ...extraLines] = consoleStub.getCalls().map((c) => c.args[0])

            expect(labelLine).to.equal(
                chalk.bgBlue(chalk.white.bold("[INFO]")) + "  " + chalk.blue("회원 가입 성공"),
            )

            expect(extraLines).to.deep.equal([
                "       ↳ {\n" +
                    '         "username": "penekhun",\n' +
                    '         "name": "MoonSeonghun"\n' +
                    "       }",
                "       ↳ 가입 시기 : 2025-01-01",
            ])
        })
    })

    context("ITDOC_DEBUG 환경변수가 ", () => {
        it("설정되지 않으면 로그레벨이 4가 된다.", async () => {
            delete process.env.ITDOC_DEBUG
            const { default: logger } = await import("../../../config/logger?" + Date.now())
            expect(logger.level).to.equal(4)
        })

        it("설정되면 로그레벨이 0이 된다.", async () => {
            process.env.ITDOC_DEBUG = "true"
            const { default: logger } = await import("../../../config/logger?" + Date.now())
            expect(logger.level).to.equal(0)
            delete process.env.ITDOC_DEBUG
        })
    })
})
