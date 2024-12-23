import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { ROLES } from "../utils/constants";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryNames,
  updateCategory,
} from "../controllers/category.controller";
import { upload } from "../config/storageBucket";
const router = Router();

router.post(
  "/",
  upload.single("image"),
  verifyAuth(Object.values([ROLES.ADMIN])),
  createCategory
);
router.get("/", getCategories);
router.get(
  "/names",
  verifyAuth(Object.values([ROLES.ADMIN])),
  getCategoryNames
);
router.put(
  "/:id",
  upload.single("image"),
  verifyAuth(Object.values([ROLES.ADMIN])),
  updateCategory
);
router.delete("/:id", verifyAuth(Object.values([ROLES.ADMIN])), deleteCategory);

export default router;
