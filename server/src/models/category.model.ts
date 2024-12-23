import { Schema, models, model, Model } from "mongoose";
import { ICategory } from "../types/type";
import mongoosePaginate from "mongoose-paginate-v2";

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category Name is required"],
      trim: true,
    },
    description: String,
    slug: {
      type: String,
      required: [true, "Category Slug is required"],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Category Image is required"],
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.plugin(mongoosePaginate);

export const Category: Model<ICategory> =
  models.Category || model<ICategory>("Category", CategorySchema);
