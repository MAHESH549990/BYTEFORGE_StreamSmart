import express from "express";
import { login } from "../controllers/authController.js";
import { register } from "../controllers/registerController.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", getMe);

export default router;