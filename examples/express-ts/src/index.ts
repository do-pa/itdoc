import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { productRoutes } from "./routes/product.routes"

dotenv.config()

export const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use("/api/products", productRoutes)

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" })
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
