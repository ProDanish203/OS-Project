import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { ROLES } from "../utils/constants";
import {
  addOrder,
  changeOrderStatus,
  getAllOrders,
  getOrderDetails,
} from "../controllers/order.controller";
import { optionalAuth } from "../middlewares/optionalAuth.middleware";

const router = Router();

router.post("/add", optionalAuth, addOrder);
router.get("/", verifyAuth(Object.values([ROLES.ADMIN])), getAllOrders);
router.patch(
  "/:id/status",
  verifyAuth(Object.values([ROLES.ADMIN])),
  changeOrderStatus
);
router.get("/:id", getOrderDetails);

export default router;
