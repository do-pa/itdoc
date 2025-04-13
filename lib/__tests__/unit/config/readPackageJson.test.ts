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
import sinon from "sinon"
import * as path from "path"
import { readItdocConfig } from "../../../config/readPackageJson"

describe("readItdocConfig()", () => {
    let fsModuleStub: { readFileSync: sinon.SinonStub }

    const mockPackageJson = {
        itdoc: {
            output: "output",
            document: {
                title: "My Title",
                version: "1.0.0",
            },
        },
    }

    beforeEach(() => {
        fsModuleStub = { readFileSync: sinon.stub() }
        fsModuleStub.readFileSync
            .withArgs(path.resolve(process.cwd(), "package.json"), "utf8")
            .returns(JSON.stringify(mockPackageJson))
    })

    it("should read the itdoc configuration from package.json", () => {
        /* @ts-expect-error TS2345: fs 모킹으로 발생하는 타입 오류 무시 */
        const config = readItdocConfig("output", "outputDefault", fsModuleStub)
        expect(config).to.equal("output")
    })

    it("should read the nested itdoc configuration from package.json", () => {
        /* @ts-expect-error TS2345: fs 모킹으로 발생하는 타입 오류 무시 */
        const config = readItdocConfig("document.title", "defaultTitle", fsModuleStub)
        expect(config).to.equal("My Title")
    })

    it("should return the default value if the itdoc configuration is not found", () => {
        /* @ts-expect-error TS2345: fs 모킹으로 발생하는 타입 오류 무시 */
        const config = readItdocConfig("nonexistentKey", "defaultValue", fsModuleStub)
        expect(config).to.equal("defaultValue")
    })
})
