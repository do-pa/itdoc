import express from "express"
import { ProductService } from "../services/productService"

const router = express.Router()

router.get("/", async (_req: express.Request, res: express.Response) => {
    try {
        const products = await ProductService.getAllProducts()
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: "Error fetching products" })
    }
})

router.get("/:id", async (req: express.Request, res: express.Response) => {
    try {
        const id = parseInt(req.params.id)
        const product = await ProductService.getProductById(id)
        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }
        return res.json(product)
    } catch (error) {
        return res.status(500).json({ message: "Error fetching product" })
    }
})

router.post("/", async (req: express.Request, res: express.Response) => {
    try {
        const { name, price, category } = req.body
        if (!name || !price) {
            return res.status(400).json({ message: "Name and price are required" })
        }
        const newProduct = await ProductService.createProduct({ name, price, category })
        return res.status(201).json(newProduct)
    } catch (error) {
        return res.status(500).json({ message: "Error creating product" })
    }
})

router.put("/:id", async (req: express.Request, res: express.Response) => {
    try {
        const id = parseInt(req.params.id)
        const { name, price, category } = req.body
        const updatedProduct = await ProductService.updateProduct(id, { name, price, category })
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" })
        }
        return res.json(updatedProduct)
    } catch (error) {
        return res.status(500).json({ message: "Error updating product" })
    }
})

router.delete("/:id", async (req: express.Request, res: express.Response) => {
    try {
        const id = parseInt(req.params.id)
        const deleted = await ProductService.deleteProduct(id)
        if (!deleted) {
            return res.status(404).json({ message: "Product not found" })
        }
        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({ message: "Error deleting product" })
    }
})

export const productRoutes = router
