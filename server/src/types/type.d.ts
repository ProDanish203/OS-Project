import { Document, PaginateModel, Schema } from "mongoose";
import { ROLES } from "../utils/constants";

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface IUser extends Document {
  email: string;
  password: string;
  phone: string;
  address?: string;
  name: string;
  role: "user" | "admin";
  avatar?: string;
  hasNotifications: boolean;
  isEmailVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
}

export interface IProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Schema.Types.ObjectId;
  images: string[];
  rating: number;
}

export interface IOrderItem {
  product: Schema.Types.ObjectId;
  quantity: number;
  price: number;
  itemTotal: number;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
}

export interface IOrder {
  orderItems: IOrderItem[];
  totalAmount: number;
  couponCode?: string;
  discount?: number;
  shippingAddress: IAddress;
  billingAddress: IAddress;
  paymentMethod: "cash_on_delivery" | "online";
  customer?: Schema.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  trackingNumber: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  stripeSessionId?: string;
}

export interface ICategory {
  name: string;
  description?: string;
  image: string;
  parentCategory?: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  slug: string;
}
