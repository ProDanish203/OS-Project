import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { ROLES } from "../utils/constants";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getProductsByCategory,
  updateProduct,
} from "../controllers/product.controller";
import { upload } from "../config/storageBucket";

const router = Router();

router.post(
  "/",
  upload.array("images", 10),
  verifyAuth(Object.values([ROLES.ADMIN])),
  createProduct
);
router.put(
  "/:id",
  upload.array("images", 10),
  verifyAuth(Object.values([ROLES.ADMIN])),
  updateProduct
);
router.delete("/:id", verifyAuth(Object.values([ROLES.ADMIN])), deleteProduct);

// Get Products
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/category/:id", getProductsByCategory);

export default router;
