import { NextFunction, Response, Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  generateTrackingNumber,
  getPaginatedData,
  throwError,
} from "../utils/helpers";
import { Order } from "../models/order.model";
import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { getImageUrl } from "../config/storageBucket";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export const addOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      orderItems,
      couponCode,
      discount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      name,
      email,
      phone,
      notes,
    } = req.body;

    if (!orderItems || !paymentMethod || !shippingAddress || !billingAddress)
      return next(throwError("All fields are required", 400));

    let totalAmount = 0;
    const orderItemsData = await Promise.all(
      orderItems.map(async (item: any) => {
        const product = await Product.findById(item.product);
        if (!product) return next(throwError("Product not found", 404));
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        return {
          product: item.product,
          quantity: item.quantity,
          price: product.price,
          itemTotal,
        };
      })
    );

    const trackingNumber = generateTrackingNumber();

    const orderData: any = {
      orderItems: orderItemsData,
      totalAmount,
      couponCode,
      discount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      trackingNumber,
      name,
      email,
      phone,
      notes,
    };
    if (req?.user?._id) orderData.customer = req.user._id;

    const order = await Order.create(orderData);
    if (!order) return next(throwError("Order not created", 500));

    return res.status(200).json({
      success: true,
      message: "Order has been placed successfully",
      data: order,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const changeOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status }: { status: OrderStatus } = req.body;

    if (!status) return next(throwError("Status is required", 400));
    if (!["pending", "processing", "completed", "cancelled"].includes(status))
      return next(throwError("Invalid status", 400));

    const order = await Order.findById(id);
    if (!order) return next(throwError("Order not found", 404));

    order.orderStatus = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status as string | undefined;

    if (
      status &&
      !["pending", "processing", "completed", "cancelled"].includes(
        status.toString()
      )
    )
      return next(throwError("Invalid status", 400));

    const query: any = {
      trackingNumber: { $regex: `^${search}`, $options: "i" },
    };

    if (status) query.orderStatus = status;

    let sort: any = { createdAt: -1 };
    if (status) {
      sort = {
        orderStatus: status === query.orderStatus ? -1 : 1,
        createdAt: -1,
      };
    }

    const populate = {
      path: "customer",
      model: User,
      select: "_id name",
    };

    const { data, pagination } = await getPaginatedData({
      model: Order,
      query,
      page,
      limit,
      sort: sort,
      populate,
      select:
        "_id trackingNumber customer name orderStatus createdAt totalAmount",
    });

    return res.status(200).json({
      success: true,
      message: "",
      data,
      pagination,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getOrderDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate([
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

    // Optionally, remove the original images array
    orderObject.orderItems.forEach((item: any) => {
      if (item.product) {
        delete item.product.images;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Order Details Fecthed Successfully",
      data: orderObject,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
