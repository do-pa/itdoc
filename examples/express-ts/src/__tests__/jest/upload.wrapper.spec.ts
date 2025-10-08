import { app } from "../../index"
import { wrapTest, createClient } from "itdoc"
import path from "path"
import fs from "fs"

const apiTest = wrapTest(it)

const request = createClient.supertest(app)

describe("Upload API - Wrapper Approach", () => {
    const testFilePath = path.join(__dirname, "test-file.txt")
    const testImagePath = path.join(__dirname, "test-image.png")

    beforeAll(() => {
        fs.writeFileSync(testFilePath, "This is a test file content")

        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
            0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08,
            0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
            0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ])
        fs.writeFileSync(testImagePath, pngBuffer)
    })

    afterAll(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath)
        }
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath)
        }
    })

    apiTest.withMeta({
        summary: "Upload a single file",
        tags: ["Upload"],
        description: "Uploads a single file using multipart/form-data",
    })("should upload a single file successfully", async () => {
        const response = await request.post("/api/upload/single").attach("file", testFilePath)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("message", "File uploaded successfully")
        expect(response.body.file).toHaveProperty("originalname", "test-file.txt")
        expect(response.body.file).toHaveProperty("mimetype", "text/plain")
    })

    apiTest.withMeta({
        summary: "Upload multiple files",
        tags: ["Upload"],
        description: "Uploads multiple files in a single request",
    })("should upload multiple files successfully", async () => {
        const response = await request
            .post("/api/upload/multiple")
            .attach("files", testFilePath)
            .attach("files", testImagePath)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("message", "Files uploaded successfully")
        expect(response.body.files).toHaveLength(2)
        expect(response.body.files[0]).toHaveProperty("originalname", "test-file.txt")
        expect(response.body.files[1]).toHaveProperty("originalname", "test-image.png")
    })

    apiTest.withMeta({
        summary: "Upload file with additional fields",
        tags: ["Upload", "Documents"],
        description: "Uploads a file along with additional form fields (title, description)",
    })("should upload file with additional form fields", async () => {
        const response = await request
            .post("/api/upload/with-fields")
            .field("title", "Important Document")
            .field("description", "This is a very important document")
            .attach("document", testFilePath)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("message", "Document uploaded successfully")
        expect(response.body.document).toHaveProperty("title", "Important Document")
        expect(response.body.document).toHaveProperty(
            "description",
            "This is a very important document",
        )
        expect(response.body.document.file).toHaveProperty("originalname", "test-file.txt")
    })

    apiTest.withMeta({
        summary: "Handle missing file upload",
        tags: ["Upload", "Error Handling"],
        description: "Returns 400 error when no file is provided",
    })("should return 400 when no file is uploaded", async () => {
        const response = await request.post("/api/upload/single").send({})

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error", "No file uploaded")
    })

    apiTest.withMeta({
        summary: "Upload image file",
        tags: ["Upload", "Images"],
        description: "Uploads an image file (PNG)",
    })("should upload an image file successfully", async () => {
        const response = await request.post("/api/upload/single").attach("file", testImagePath)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("message", "File uploaded successfully")
        expect(response.body.file).toHaveProperty("originalname", "test-image.png")
        expect(response.body.file).toHaveProperty("mimetype", "image/png")
    })
})
