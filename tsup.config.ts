import { defineConfig } from "tsup"
import fg from "fast-glob"
import { copyFile, mkdir } from "node:fs/promises"
import path from "node:path"

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
        onSuccess: async () => {
            const entries = await fg("examples/**/*", {
                dot: true,
                onlyFiles: true,
                ignore: ["**/node_modules/**"],
            })
            await mkdir("build/examples", { recursive: true })
            await Promise.all(
                entries.map(async (src) => {
                    const dest = path.join("build", src)
                    await mkdir(path.dirname(dest), { recursive: true })
                    await copyFile(src, dest)
                }),
            )
        },
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
        external: [
            "debug",
            "supports-color",
            "tty",
            "@babel/parser",
            "@babel/types",
            "@babel/traverse",
        ],
    },
])
