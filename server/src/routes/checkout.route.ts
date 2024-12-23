import express, { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { ROLES } from "../utils/constants";
import {
  createPaymentLink,
  handleStripeWebhook,
} from "../controllers/checkout.controller";

const router = Router();

router.post("/payment", verifyAuth(Object.values(ROLES)), createPaymentLink);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
