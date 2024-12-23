import { Schema, models, model, Model } from "mongoose";
import { IProduct } from "../types/type";
import mongoosePaginate from "mongoose-paginate-v2";

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product Name is required"],
    },
    description: {
      type: String,
      required: [true, "Product Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product Price is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product Category is required"],
    },
    stock: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating must not exceed 5"],
    },
    images: {
      type: [String],
      required: [true, "Product Images are required"],
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.plugin(mongoosePaginate);

export const Product: Model<IProduct> =
  models.Product || model<IProduct>("Product", ProductSchema);
