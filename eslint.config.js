import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"
import jsdoc from "eslint-plugin-jsdoc"
import globals from "globals"
import mochaPlugin from "eslint-plugin-mocha"
import licenseHeader from "eslint-plugin-license-header"

export default tseslint.config(
    {
        ignores: ["**/node_modules/**", "**/build/**", "**/examples/**", "tsup.config.ts", "itdoc-doc/**"],
    },
    // ESLint 기본 추천 규칙
    eslint.configs.recommended,
    // TypeScript 추천 규칙
    ...tseslint.configs.recommended,
    // JSDoc 문서화 추천 규칙
    jsdoc.configs["flat/recommended"],
    // Mocha 플러그인 설정
    {
        plugins: {
            mocha: mochaPlugin,
        },
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            // 사용할 JavaScript 버전 지정
            ecmaVersion: 2022,
            // ESM 모듈 시스템 사용
            sourceType: "module",
            // TypeScript 파서 사용
            parser: tseslint.parser,
            parserOptions: {
                // TypeScript 설정 파일 지정
                project: ["./tsconfig.json", "./tsconfig.test.json"],
            },
            // env 대신 globals 사용
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
            // TypeScript 관련 규칙
            // 함수의 반환 타입 명시 필수
            "@typescript-eslint/explicit-function-return-type": "error",
            // 사용하지 않는 변수 에러 처리 (_로 시작하는 변수는 제외)
            "@typescript-eslint/no-explicit-any": "warn", // error에서 warn으로 변경
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            // 클래스 멤버의 접근 제한자 명시 필수
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                { accessibility: "explicit" },
            ],
            "@typescript-eslint/no-require-imports": "warn", // error에서 warn으로 변경

            // JSDoc 규칙 완화
            "jsdoc/require-description": "warn",
            "jsdoc/require-param-description": "warn",
            "jsdoc/require-returns-description": "warn",
            "jsdoc/require-example": "off", // 필수 예제 비활성화
            "jsdoc/check-examples": "off", // 예제 검사 비활성화
            "jsdoc/require-throws": "warn",
            "jsdoc/require-param": "warn",
            "jsdoc/require-returns": "warn",
            "jsdoc/require-param-type": "warn",

            // 코드 품질 규칙
            // 중첩 콜백 최대 3개까지 허용
            "max-nested-callbacks": ["error", 3],
            // 함수당 최대 50줄 제한 (빈 줄과 주석 제외)
            "max-lines-per-function": [
                "warn", // error에서 warn으로 변경
                { max: 150, skipBlankLines: true, skipComments: true },
            ],

            // Mocha 테스트 규칙
            "mocha/no-skipped-tests": "warn",
            // 단독 실행 테스트 금지
            "mocha/no-exclusive-tests": "error",

            // 라이센스 헤더 규칙
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

            // no-console 규칙
            "no-console": "error",
        },
        // JSDoc 설정
        settings: {
            jsdoc: {
                mode: "typescript",
                // 태그 이름 설정
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
    // Prettier와의 충돌 방지
    eslintConfigPrettier,
)
