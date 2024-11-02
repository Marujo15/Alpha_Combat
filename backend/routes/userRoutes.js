import { Router } from "express";
import { userController } from "../controllers/userController.js";

const router = Router();

router.get("/", userController.getAllUsers);
router.get("/me", userController.getUserMe);
router.get("/:userId", userController.getUserById);
router.patch("/", userController.updateUser);
router.delete("/:userId", userController.deleteUser);

export default router;
