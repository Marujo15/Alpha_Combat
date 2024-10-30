import { Router } from "express";
import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", authenticateJWT, userRouter);

export default router;
