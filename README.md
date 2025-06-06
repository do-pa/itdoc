# <img src="https://github.com/do-pa/itdoc/blob/develop/itdoc-doc/static/img/logo.png?raw=true" align="right" width="100">itdoc

[![Build Status](https://github.com/do-pa/itdoc/actions/workflows/ci.yml/badge.svg)](https://github.com/do-pa/itdoc/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/itdoc.svg)](https://www.npmjs.com/package/itdoc)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D20.0.0-brightgreen?logo=node.js&logoColor=white&style=flat-square)
[![License](https://img.shields.io/:license-apache-brightgreen.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Discord](https://img.shields.io/badge/Chat-Discord-5765F2.svg)](https://discord.gg/ZhXk7VSu5Z)

Create reliable, test-driven API documentation – straight from your Node.js tests!

## Features

- 🧪 Test-driven API documentation generation
- 📄 Supports OpenAPI, Markdown, [HTML output]
- 🚫 Fails to generate docs if tests fail – ensures accuracy
- 🔧 Easy integration with your existing test suite
- 🧩 Framework-agnostic (Express, NestJS.)
- 🤖 GPT-powered test case generation for faster documentation

[HTML output]: http://redocly.com/demo/openapi/museum-api/operations/getmuseumhours

## Quick Start

```bash
npm install itdoc --save-dev
```

## Overview

The main goal of this project is to reliably document RESTful web services written in JavaScript.
Unlike typical JSON or JSDoc-based API documentation, itdoc extracts request/response examples
directly from test code. Since the documentation is only generated when tests pass, you can always
publish the most up-to-date, verified API information.

itdoc combines your written descriptions with test results to generate documentation.

Here’s a sample test-based API doc definition:

```javascript
import { describeAPI, itDoc, field, HttpMethod, HttpStatus } from "itdoc"

// Assume you have an Express app
const targetApp = app

describeAPI(
    HttpMethod.POST,
    "/signup",
    {
        name: "Sign Up API",
        tag: "Auth",
        summary: "Receives a username and password from the user to perform sign-up.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Successful sign-up", () => {
            return apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "penekhun"),
                    password: field("Password", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.CREATED)
        })

        itDoc("Fails to sign up if username is not provided.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    password: field("Password", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error message", "username is required"),
                })
        })

        itDoc("Fails to sign up if password is 8 characters or fewer.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "penekhun"),
                    password: field("Password", "1234567"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error message", "password must be at least 8 characters"),
                })
        })
    },
)
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/8251bb8e-3829-4488-8992-8450d12403b8" alt="itdoc docs workflow" style="width:30%;">
</p>

Test-based documentation will always reflect the actual behavior of your API. As long as your tests
pass, you can export the documentation to formats such as [OpenAPI Specification], Markdown, or HTML
— and deploy it however you like.

[OpenAPI Specification]: https://swagger.io/specification/

<!--
## env 설정

.env를 설정해서 GPT API기반으로 테스트를 생성할 수 있습니다. .env.example를 기반으로 설정해주세요.
-->

> For detailed usage and additional information, please visit
> [https://itdoc.kr/](https://itdoc.kr/).

## Contributing

We welcome contributions! Please open an issue or submit a pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms of the [Apache 2.0].

[Apache 2.0]: LICENSE.txt
