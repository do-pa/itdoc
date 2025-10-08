export interface Product {
    id: number
    name: string
    price: number
    category: string
}

let products: Product[] = [
    { id: 1, name: "Laptop", price: 999.99, category: "Electronics" },
    { id: 2, name: "Smartphone", price: 699.99, category: "Electronics" },
]

let nextId = 3

export const ProductService = {
    getAllProducts: async (): Promise<Product[]> => {
        return products
    },

    getProductById: async (id: number): Promise<Product | undefined> => {
        return products.find((p) => p.id === id)
    },

    createProduct: async (productData: Omit<Product, "id">): Promise<Product> => {
        const newProduct = {
            id: nextId++,
            ...productData,
        }
        products.push(newProduct)
        return newProduct
    },

    updateProduct: async (
        id: number,
        productData: Partial<Omit<Product, "id">>,
    ): Promise<Product | undefined> => {
        const product = products.find((p) => p.id === id)
        if (!product) return undefined

        Object.assign(product, productData)
        return product
    },

    deleteProduct: async (id: number): Promise<boolean> => {
        const index = products.findIndex((p) => p.id === id)
        if (index === -1) return false

        products.splice(index, 1)
        return true
    },

    resetProducts: () => {
        products = [
            { id: 1, name: "Laptop", price: 999.99, category: "Electronics" },
            { id: 2, name: "Smartphone", price: 699.99, category: "Electronics" },
        ]
        nextId = 3
    },
}
