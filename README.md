# <img src="https://github.com/do-pa/itdoc/blob/develop/itdoc-doc/static/img/logo.png?raw=true" align="right" width="100">itdoc

[![Build Status](https://github.com/do-pa/itdoc/actions/workflows/ci.yml/badge.svg)](https://github.com/do-pa/itdoc/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/itdoc.svg)](https://www.npmjs.com/package/itdoc)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D20.0.0-brightgreen?logo=node.js&logoColor=white&style=flat-square)
[![License](https://img.shields.io/:license-apache-brightgreen.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Discord](https://img.shields.io/badge/Chat-Discord-5765F2.svg)](https://discord.gg/ZhXk7VSu5Z)

**itdoc is a Node.js tool for automatically generating API documentation based on your test
code.**  
Hate writing docs? Let your tests do it. Your API docs stay in sync—no surprises, ever.

> A perfect alternative to [swagger-jsdoc] and [swagger-ui-express].

[swagger-jsdoc]: https://github.com/Surnet/swagger-jsdoc
[swagger-ui-express]: https://github.com/scottie1984/swagger-ui-express

- **Test-based Documentation:** itdoc generates documentation by directly extracting API request and
  response examples from your test code, ensuring your documentation accurately reflects your API
  behavior.
- **Multiple Documentation Formats:** Export documentation in various formats, such as
  [OpenAPI Specification](https://swagger.io/specification/), Markdown, and HTML
  ([Redoc-style](https://redocly.github.io/redoc/)).
- **Supports Various Frameworks:** Compatible with popular Node.js frameworks like Express, NestJS,
  fastify.
- **Easy to Use Without Complex Configuration:** Generate documentation effortlessly by writing
  tests alone. ([Optional configuration is available](https://itdoc.kr/docs/guides/configuration))

[//]: # "TODO : 나중에 CLI 문서 작성된다면, REAMDE에 추가할 것."
[OpenAPI Specification]: https://swagger.io/specification/
[Redoc-style]: https://redocly.github.io/redoc/
[HTML output]: http://redocly.com/demo/openapi/museum-api/operations/getmuseumhours

## Installation

```bash
npm install itdoc --save-dev
```

## Documentation

Full documentation for itdoc can be found on the [official website](https://itdoc.kr/).

> you can contribute to improving our documentation by submitting a PR to our
> [docs folder](https://github.com/do-pa/itdoc/tree/develop/itdoc-doc).

## Examples

We have several examples available in the [examples directory]. Here's a simple Express example to
help you get started.

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
    },
)
```

[examples directory]: https://github.com/do-pa/itdoc/tree/develop/examples

> - If you are using Express, please refer to the [Quick Start Guide].
> - If you are using NestJS, please refer to the [Quick Start Guide] and [NestJS guide].
> - If you are using fastify, please refer to the [Quick Start Guide] and [fastify guide].

[Quick Start Guide]: https://itdoc.kr/docs/guides/quick-start
[NestJS guide]: https://itdoc.kr/docs/guides/framework-guide/#nestjs-example
[fastify guide]: https://itdoc.kr/docs/guides/framework-guide/#fastify-example

## Running Tests

Since `describeAPI()` and `itdoc()` integrate seamlessly with testing frameworks like
[Jest](https://jestjs.io/docs/getting-started) and [Mocha](https://mochajs.org/#getting-started),
you can simply use your existing test commands such as `mocha .` or `jest .` without any changes.

## Contributing

We welcome contributions! Please open an issue or submit a pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms of the [Apache 2.0 License](LICENSE.txt).
