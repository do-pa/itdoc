import express from "express"
const router = express.Router()
import { getUser, loginUser, registerUser } from "../services/userService"

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/:id", getUser)

export const userRoutes = router
