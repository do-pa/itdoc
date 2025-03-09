// index.mjs (ES 모듈 방식)
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// __dirname 설정 (ES 모듈에서는 직접 설정해줘야 함)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 출력 폴더의 절대 경로 설정
const outputDir = join(__dirname, 'output');

// output 폴더가 없으면 생성
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
  console.log(`${outputDir} 디렉토리가 생성되었습니다.`);
}

try {
  console.log('Step 1: OpenAPI YAML 파일을 Markdown으로 변환 중 (widdershins)...');
  // openapi.yaml 파일의 절대 경로
  const openapiPath = join(__dirname, '../oas/openapi.yaml');
  execSync(`widdershins "${openapiPath}" -o "${join(outputDir, 'output.md')}"`, { stdio: 'inherit', cwd: __dirname });
  console.log('Markdown 파일 생성 완료: output.md');

  console.log('Step 2: Redocly CLI를 사용하여 HTML 문서 생성 중...');
  execSync(`npx @redocly/cli build-docs "${openapiPath}" --output "${join(outputDir, 'redoc.html')}"`, { stdio: 'inherit', cwd: __dirname });
  console.log('HTML 문서 생성 완료: redoc.html');

  console.log('모든 작업이 성공적으로 완료되었습니다.');
} catch (error) {
  console.error('오류 발생:', error);
  process.exit(1);
}
