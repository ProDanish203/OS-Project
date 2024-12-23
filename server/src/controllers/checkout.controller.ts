import { NextFunction, Response, Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { config } from "dotenv";
import Stripe from "stripe";
import { Order } from "../models/order.model";
import { throwError } from "../utils/helpers";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { getImageUrl } from "../config/storageBucket";

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const createPaymentLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));
    const { orderId } = req.body;

    if (!orderId) return next(throwError("Order Id is required", 400));

    const order = await Order.findById(orderId).populate([
      {
        path: "orderItems.product",
        model: Product,
        select: "_id name images",
      },
      {
        path: "customer",
        model: User,
        select: "_id name phone email",
      },
    ]);
    if (!order) return next(throwError("Order not found", 404));

    const orderObject = order.toObject();

    orderObject.orderItems = orderObject.orderItems.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        coverImage:
          item.product.images && item.product.images.length > 0
            ? getImageUrl(item.product.images[0])
            : null,
      },
    }));

    orderObject.orderItems.forEach((item: any) => {
      if (item.product) {
        delete item.product.images;
      }
    });

    const lineItems = orderObject.orderItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          images: [item.product.coverImage],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const customer = orderObject.customer as any;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&trackingNumber=${order.trackingNumber}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/error`,
      customer_email: customer.email,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    // Update the order with the Stripe session ID
    // order.stripeSessionId = session.id;
    // await order.save();

    return res.status(200).json({
      success: true,
      message: "Checkout session created successfully",
      data: session.url,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      // We can get the orderId in two ways,
      // 1. Save it in the metadata when creating the session
      // 2. Save the session id in the order and then find the order by session id
      // Update the order status
      // 1st way
      const orderId = session.metadata?.orderId;
      if (session.payment_status === "paid" && orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "paid",
          orderStatus: "Processing",
        });
      }
      // //  2nd way
      //   const order = await Order.findOne({ stripeSessionId: session.id });
      //   if (order) {
      //     order.paymentStatus = "paid";
      //     order.orderStatus = "processing";
      //     order.stripeSessionId = "";
      //     await order.save();
      //   }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
