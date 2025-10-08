import type { Config } from "jest"

const jestConfig: Config = {
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/jest/**/*.spec.ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
                diagnostics: {
                    ignoreCodes: [18046],
                },
            },
        ],
    },
    collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/__tests__/**/*"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    verbose: true,
    errorOnDeprecated: true,
    clearMocks: true,
    restoreMocks: true,
}

export default jestConfig
