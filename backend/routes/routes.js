import { Router } from "express";
import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";
import leaderboardRouter from "./leaderboardRoutes.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", authenticateJWT, userRouter);
router.use("/leaderboards", authenticateJWT, leaderboardRouter);

export default router;
