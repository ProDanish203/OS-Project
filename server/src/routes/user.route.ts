import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { getUsers } from "../controllers/user.controller";
import { ROLES } from "../utils/constants";
const router = Router();

router.get("/", verifyAuth(Object.values([ROLES.ADMIN])), getUsers);

export default router;
