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

const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")

describeAPI(
    HttpMethod.GET,
    "/",
    {
        summary: "Default Route",
        tag: "Default",
        description: "Default route that returns a personalized greeting JSON response",
    },
    globalThis.__APP__,
    (apiDoc) => {
        itDoc("should return a personalized greeting JSON response", () => {
            return apiDoc
                .test()
                .req()
                .queryParam({
                    username: "penek",
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    username: field("The username", "penek"),
                    message: field("Greeting message", "Hello, penek! Welcome to our API."),
                })
        })

        itDoc("should return an error if username is not provided", () => {
            return apiDoc
                .test()
                .req()
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error message", "Username is required"),
                })
        })
    },
)
