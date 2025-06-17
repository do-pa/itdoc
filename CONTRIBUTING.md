# Contributing to itdoc

Thank you for your interest in contributing to itdoc! This document will guide you through the
process of making contributions and help you understand how you can best participate.

## License

itdoc is released under the [Apache 2.0 license]. Please ensure your contributions comply with this
license.

[Apache 2.0 license]: https://www.apache.org/licenses/LICENSE-2.0

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you agree to uphold these standards. Please familiarize yourself with these
guidelines.

## Reporting Security Vulnerabilities

If you discover a security vulnerability within itdoc, please immediately report it privately by
emailing [itdoc.js@gmail.com](mailto:itdoc.js@gmail.com). Do not disclose vulnerabilities publicly.

## How to Contribute

### Setting Up the Development Environment

Good news! itdoc provides pre-configured `.vscode` and `.idea` directories for contributors using VS
Code and IntelliJ IDEA. These configurations ensure automatic code formatting. Additionally, we use
[Husky](https://typicode.github.io/husky/) to automatically enforce coding conventions prior to
commits.

> **This means contributors don't need to manually format their code to meet project guidelines!**

### Issues

1. **Check existing issues**: Before creating a new issue, please ensure a similar issue does not
   already exist by using the search functionality on our
   [issues page](https://github.com/do-pa/itdoc/issues).
2. **Create clear and concise issues**: When creating an issue, always use the provided issue
   template. Clearly describe the issue, and if applicable, include:
    - Steps to reproduce the problem
    - Expected vs actual behavior
    - Screenshots or code snippets

### Pull Requests (PRs)

To ensure a smooth PR review and merge process, please follow these steps:

#### Before Committing

- Ensure all tests pass by running:
    ```shell
    pnpm test
    ```
- Whenever possible, add tests:
    - **Unit tests**: Place unit tests under `lib/tests/unit/`.
    - **Integration or complex tests**: Place these under the `examples/` directory.

#### Creating a Pull Request

- Clearly describe the changes you have made and why they are necessary.
- Reference any related issue numbers in your PR description (e.g., `Closes #123`).
- Ensure your PR title is concise and descriptive of the change (e.g., "Fix issue with X", "Add
  feature Y").
- After creating a PR, monitor it for any comments or requested changes by maintainers or other
  contributors.

### Review Process

- PRs are reviewed by maintainers and may require adjustments based on feedback.
- Once approved and all checks pass, your PR will be merged.

### Communication

Feel free to ask questions or discuss issues and enhancements on our
[Discord server](https://discord.gg/ZhXk7VSu5Z). We encourage open communication and collaboration!
