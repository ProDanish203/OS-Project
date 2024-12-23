import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { ROLES } from "../utils/constants";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/auth.controller";
const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/current-user", verifyAuth(Object.values(ROLES)), getCurrentUser);
router.post("/logout", verifyAuth(Object.values(ROLES)), logoutUser);

export default router;
