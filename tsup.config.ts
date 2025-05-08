import { defineConfig } from "tsup"

export default defineConfig([
    {
        entry: ["lib/dsl/index.ts"],
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        clean: true,
        external: ["express", "mocha", "jest", "chalk", "supertest"],
        outDir: "build",
        target: "node20",
        platform: "node",
        splitting: false,
        treeshake: true,
        minify: false,
        metafile: false,
        noExternal: ["consola"],
    },
    {
        entry: ["bin/index.ts"],
        format: ["esm"],
        dts: false,
        sourcemap: false,
        clean: false,
        outDir: "build/bin",
        target: "node20",
        platform: "node",
        banner: { js: "#!/usr/bin/env node" },
        onSuccess: "cp -R examples build/examples",
    },
])
