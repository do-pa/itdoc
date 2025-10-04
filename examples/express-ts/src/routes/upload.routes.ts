import { Router } from "express"
import multer from "multer"

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Single file upload
router.post("/single", upload.single("file") as any, (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
    }

    res.status(201).json({
        message: "File uploaded successfully",
        file: {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        },
    })
})

// Multiple files upload
router.post("/multiple", upload.array("files", 5) as any, (req: any, res: any) => {
    const files = req.files as any[]

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" })
    }

    res.status(201).json({
        message: "Files uploaded successfully",
        files: files.map((f) => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
        })),
    })
})

// File upload with additional fields
router.post("/with-fields", upload.single("document") as any, (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
    }

    const { title, description } = req.body

    res.status(201).json({
        message: "Document uploaded successfully",
        document: {
            title: title || "Untitled",
            description: description || "",
            file: {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        },
    })
})

export { router as uploadRoutes }
