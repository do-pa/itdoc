import { Request, Response } from "express"

export const registerUser = (req: Request, res: Response) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." })
    }
    res.status(201).json({ message: "User registered successfully", user: { username } })
}

export const loginUser = (req: Request, res: Response) => {
    const { username, password } = req.body
    if (username === "admin" && password === "admin") {
        return res.status(200).json({ message: "Login successful", token: "fake-jwt-token" })
    }
    res.status(401).json({ message: "Invalid credentials" })
}

export const getUser = (req: Request, res: Response) => {
    const { id } = req.params
    res.status(200).json({
        id,
        username: "exampleUser",
        email: "user@example.com",
        profilePicture: null,
    })
}
