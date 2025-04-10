import { defineConfig } from "tsup"

export default defineConfig({
    // 진입점 설정
    entry: ["lib/dsl/index.ts"],

    // 출력 형식 설정
    // ESM과 CommonJS 두 가지 형식으로 번들 생성
    format: ["esm", "cjs"],

    // TypeScript 타입 정의 파일 생성
    dts: true,

    // 디버깅을 위한 소스맵 생성
    sourcemap: true,

    // 빌드 전 dist 디렉토리 정리
    clean: true,

    // 번들에서 제외할 외부 의존성
    external: ["express", "mocha", "jest"],

    // 번들 출력 디렉토리
    outDir: "build",

    // 대상 Node.js 버전 (20.x)
    target: "node20",

    // 실행 환경 설정
    platform: "node",

    // 코드 분할 비활성화
    // 단일 진입점 사용으로 불필요
    splitting: false,

    // 트리쉐이킹 활성화
    // 사용하지 않는 코드 제거
    treeshake: true,

    // 코드 최소화 비활성화
    // 개발 편의성 및 빌드 속도 개선
    minify: false,

    // 빌드 메타데이터 생성 비활성화
    metafile: false,

    // 항상 번들에 포함할 패키지
    noExternal: ["supertest", "consola"],
})
