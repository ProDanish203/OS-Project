import { Schema, models, model, Model } from "mongoose";
import { IAddress, IOrder, IOrderItem } from "../types/type";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
});

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  itemTotal: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderItems: {
      type: [OrderItemSchema],
      required: [true, "Order items are required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
    },
    couponCode: String,
    discount: Number,
    shippingAddress: {
      type: AddressSchema,
      required: [true, "Shipping address is required"],
    },
    billingAddress: {
      type: AddressSchema,
      required: [true, "Billing address is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online"],
      required: [true, "Payment method is required"],
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: validator.isEmail,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      minlength: [8, "Phone number is invalid"],
      maxlength: [15, "Phone number is invalid"],
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    trackingNumber: {
      type: String,
      unique: true,
      required: [true, "Tracking number is required"],
      index: true,
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

OrderSchema.plugin(mongoosePaginate);

export const Order: Model<IOrder> =
  models.Order || model<IOrder>("Order", OrderSchema);
