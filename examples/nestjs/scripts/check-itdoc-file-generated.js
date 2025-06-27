const fs = require("fs")
const path = require("path")

/**
 * <b>NOTE</b>
 *
 * This script is used to verify that the itdoc output file is properly generated in your nestjs environment.
 *
 * Unlike `example-express`, this script only checks if the file was created.
 */

const outputDir = path.resolve(__dirname, "../output")
const expectedFiles = ["api.md", "oas.json", "redoc.html"]

let missingFiles = []

console.log(`🔍 Checking for expected files are generated successfully : ${outputDir}`)

for (const file of expectedFiles) {
    const filePath = path.join(outputDir, file)
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing: ${file}`)
        missingFiles.push(file)
    } else {
        console.log(`✅ Found: ${file}`)
    }
}

if (missingFiles.length > 0) {
    console.error(`❗ Missing ${missingFiles.length} file(s):`, missingFiles.join(", "))
    process.exit(1)
}

console.log("🎉 All expected files exist!")
