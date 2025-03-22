import { execSync } from "child_process"
import { existsSync, mkdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import chalk from "chalk"

/**
 * 현재 파일의 절대 경로를 가져옵니다.
 * @constant {string}
 */
const __filename: string = fileURLToPath(import.meta.url)

/**
 * 현재 파일이 위치한 디렉토리의 경로를 가져옵니다.
 * @constant {string}
 */
const __dirname: string = dirname(__filename)

/**
 * 콘솔에 헤더를 출력합니다.
 * @param {string} title - 출력할 헤더 제목
 * @returns {void}
 */
const printHeader = (title: string): void => {
    const border = "=".repeat(60)
    console.log(chalk.blue.bold(border))
    console.log(chalk.blue.bold(title))
    console.log(chalk.blue.bold(border))
    console.log("")
}

/**
 * 출력 디렉토리의 경로를 설정합니다.
 * @constant {string}
 */
const outputDir: string = join(__dirname, "../", "output")

// 출력 디렉토리가 존재하지 않으면 생성합니다.
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
    console.log(chalk.green(`디렉토리 생성됨: ${outputDir}`))
    console.log("")
}

/**
 * OpenAPI YAML 파일의 경로를 설정합니다.
 * @constant {string}
 */
const openapiPath: string = join(__dirname, "../oas/openapi.yaml")

// OpenAPI 파일이 존재하지 않으면 에러 메시지를 출력하고 종료합니다.
if (!existsSync(openapiPath)) {
    console.error(chalk.red(`오류: OAS 파일을 찾을 수 없습니다. 경로: ${openapiPath}`))
    process.exit(1)
}

try {
    // 스크립트 시작을 알리는 헤더 출력
    printHeader("ITDOC 스크립트 시작")

    console.log(chalk.yellow("Step 1: OpenAPI YAML 파일을 Markdown으로 변환 중"))
    const markdownPath = join(outputDir, "output.md")
    /**
     * npx widdershins 명령어를 실행하여 OpenAPI YAML 파일을 Markdown으로 변환합니다.
     */
    execSync(`npx widdershins "${openapiPath}" -o "${markdownPath}"`, {
        stdio: "inherit",
        cwd: __dirname,
    })
    console.log(chalk.green(`Markdown 파일 생성 완료: ${markdownPath}\n`))

    console.log(chalk.yellow("Step 2: Redocly CLI를 사용하여 HTML 문서 생성 중"))
    const htmlPath = join(outputDir, "redoc.html")
    /**
     * npx @redocly/cli 명령어를 실행하여 OpenAPI YAML 파일을 HTML 문서로 변환합니다.
     */
    execSync(`npx @redocly/cli build-docs "${openapiPath}" --output "${htmlPath}"`, {
        stdio: "inherit",
        cwd: __dirname,
    })
    console.log(chalk.green(`HTML 문서 생성 완료: ${htmlPath}\n`))

    // 모든 작업 완료를 알리는 헤더 출력
    printHeader("모든 작업이 성공적으로 완료되었습니다.")
} catch (error: unknown) {
    // 오류 발생 시, 에러 메시지를 출력하고 프로세스를 종료합니다.
    console.error(chalk.red("오류 발생:"), error)
    process.exit(1)
}
