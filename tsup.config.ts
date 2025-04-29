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

        // 빌드가 끝난 뒤 onSuccess 훅에서 복사 작업 수행
        onSuccess: async () => {
            // examples 폴더 내 모든 파일 중 node_modules 는 제외
            const entries = await fg("examples/**/*", {
                dot: true,
                onlyFiles: true,
                ignore: ["**/node_modules/**"],
            })

            // build/examples 폴더 생성
            await mkdir("build/examples", { recursive: true })

            // 하나씩 복사
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
    },
])
