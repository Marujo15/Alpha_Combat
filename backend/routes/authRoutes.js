import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { authController } from "../controllers/authController.js";

const router = Router();

router.post("/register", userController.createUser);
router.post("/login", authController.authenticate);
router.delete("/logout", authController.logout);
router.post('/set-password', authController.setPassword)

export default router;
