import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { productRoutes } from "./routes/product.routes"
import { userRoutes } from "./routes/user.routes"

dotenv.config()

export const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use("/api/user", userRoutes)
app.use("/api/products", productRoutes)

app.get("/health", (_req, res) => {
    const baseResponse = {
        status: "OK",
        message: "Server is running",
    }

    const runtimeInfo = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
    }

    const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        cpuCount: process.cpuUsage().user,
        env: process.env.NODE_ENV || "unknown",
    }

    const healthPayload = {
        ...baseResponse,
        data: {
            ...runtimeInfo,
            ...systemInfo,
        },
    }
    res.status(200).json(healthPayload)
})

app.use((err: Error, _req: express.Request, res: express.Response) => {
    console.error(err.stack)
    res.status(500).json({ error: "Something went wrong!" })
})

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}
