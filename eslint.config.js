import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"
import jsdoc from "eslint-plugin-jsdoc"
import globals from "globals"
import mochaPlugin from "eslint-plugin-mocha"
import licenseHeader from "eslint-plugin-license-header"

export default tseslint.config(
    {
        ignores: [
            "**/node_modules/**",
            "**/build/**",
            "**/examples/**",
            "tsup.config.ts",
            "itdoc-doc/**",
            "**/*.md",
            "**/*.mdx",
            "output/**",
        ],
    },
    // Apply the default ESLint recommended rules.
    eslint.configs.recommended,
    // Apply the TypeScript recommended rules.
    ...tseslint.configs.recommended,
    // Apply the recommended JSDoc documentation rules.
    jsdoc.configs["flat/recommended"],
    // Configure the Mocha plugin.
    {
        plugins: {
            mocha: mochaPlugin,
        },
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            // Target the specified JavaScript version.
            ecmaVersion: 2022,
            // Use the ESM module system.
            sourceType: "module",
            // Use the TypeScript parser.
            parser: tseslint.parser,
            parserOptions: {
                // Reference the TypeScript project configuration files.
                project: ["./tsconfig.json", "./tsconfig.test.json"],
            },
            // Provide globals instead of using env shortcuts.
            globals: {
                ...globals.node,
                ...globals.es2022,
                ...globals.mocha,
            },
        },
        plugins: {
            jsdoc,
            "license-header": licenseHeader,
        },
        rules: {
            // Configure TypeScript-specific rules.
            // Require explicit return types, temporarily disabled due to the widdershins module.
            "@typescript-eslint/explicit-function-return-type": "off",
            // Flag unused variables while allowing names that start with an underscore.
            "@typescript-eslint/no-explicit-any": "warn", // Set severity to warn instead of error.
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            // Require explicit access modifiers on class members.
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                { accessibility: "explicit" },
            ],
            "@typescript-eslint/no-require-imports": "warn", // Set severity to warn instead of error.

            // Relax certain JSDoc rules.
            "jsdoc/require-description": "warn",
            "jsdoc/require-param-description": "warn",
            "jsdoc/require-returns-description": "warn",
            "jsdoc/require-example": "off", // Disable mandatory examples.
            "jsdoc/check-examples": "off", // Disable example validation.
            "jsdoc/require-throws": "warn",
            "jsdoc/require-param": "warn",
            "jsdoc/require-returns": "warn",
            "jsdoc/require-param-type": "warn",

            // Configure code-quality rules.
            // Allow up to three nested callbacks.
            "max-nested-callbacks": ["error", 3],
            // Warn when a function exceeds 150 lines excluding blanks and comments.
            "max-lines-per-function": [
                "warn", // Set severity to warn instead of error.
                { max: 150, skipBlankLines: true, skipComments: true },
            ],

            // Configure Mocha test rules.
            "mocha/no-skipped-tests": "warn",
            // Forbid exclusive tests.
            "mocha/no-exclusive-tests": "error",

            // Enforce the license header rule.
            "license-header/header": [
                "error",
                [
                    "/*",
                    " * Copyright " + new Date().getFullYear() + " the original author or authors.",
                    " *",
                    ' * Licensed under the Apache License, Version 2.0 (the "License");',
                    " * you may not use this file except in compliance with the License.",
                    " * You may obtain a copy of the License at",
                    " *",
                    " *    http://www.apache.org/licenses/LICENSE-2.0",
                    " *",
                    " * Unless required by applicable law or agreed to in writing, software",
                    ' * distributed under the License is distributed on an "AS IS" BASIS,',
                    " * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                    " * See the License for the specific language governing permissions and",
                    " * limitations under the License.",
                    " */",
                ],
            ],

            // Temporarily disable no-console because of the widdershins module.
            "no-console": "off",
        },
        // Configure JSDoc settings.
        settings: {
            jsdoc: {
                mode: "typescript",
                // Configure tag name preferences.
                tagNamePreference: {
                    returns: "returns",
                    example: "example",
                },
            },
        },
    },
    {
        files: ["**/__tests__/**/*.ts"],
        rules: {
            "max-lines-per-function": "off",
            "max-nested-callbacks": "off",
        },
    },
    // Prevent conflicts with Prettier.
    eslintConfigPrettier,
)
