# Contributing to Itdoc

Itdoc is released under the Apache 2.0 license. If you would like to contribute something, or want
to hack on the code this document should help you get started.

## Code of Conduct

This project adheres to the Contributor Covenant [code of conduct](CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code

## Reporting Security Vulnerabilities

If you discover a security vulnerability within ItdocJS, Please email [itdoc.js@gmail.com].

[itdoc.js@gmail.com]: mailto:itdoc.js@gmail.com

## For your first contribution

### Code Conventions and Housekeeping

Good news! Itdoc provides .vscode and .idea folders for contributors using VS Code and IntelliJ.
Thanks to these folders, code formatting is automatically applied. Additionally, Husky is used to
enforce code conventions before git commits.

> **This means contributors don't need to worry about adhering to our project's coding
> conventions!**

### Issues

1. Before creating a new issue, please check if a similar issue already exists. You can do this by
   using the search bar on the issues page.

2. Use the provided issue template and describe the issue as clearly as possible. Including code
   that reproduces the problem is highly recommended.

### Pull Requests

1. Before pushing a commit  
   Ensure that all tests pass by running pnpm test. If possible, please write tests.
    - Unit tests should be placed in lib/**tests**/unit.
    - More complex tests(such as integration tests) should be added under examples/.
2. Before creating a PR  
   Use the provided issue template and describe the changes in detail. If the PR is related to an
   existing issue, mention the issue number in the description.
