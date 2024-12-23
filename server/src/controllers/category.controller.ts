import { NextFunction, Response, Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getPaginatedData, throwError } from "../utils/helpers";
import { Category } from "../models/category.model";
import mongoose from "mongoose";
import { getImageUrl, removeFile, uploadFile } from "../config/storageBucket";

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));
    const { name, description, slug } = req.body;
    const { parentCategory } = req.query;
    if (!name) return next(throwError("Category Name is required", 400));
    if (!slug) return next(throwError("Category Slug is required", 400));

    // find parent category if any
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) return next(throwError("Parent category not found", 404));
    }

    // Upload image to S3
    const { response, filename } = await uploadFile(req.file!);
    if (!response) return next("Failed to upload image");

    const category = await Category.create({
      name,
      image: filename,
      description,
      slug,
      parentCategory: parentCategory || null,
      createdBy: req.user._id,
    });

    if (!category)
      return next(
        throwError("An unexpected error occurred while creating category", 500)
      );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const filter: any = req.query.filter || "";
    const parentId = req.query.parentId || null;
    let sortDirection = 1;

    if (filter.toLowerCase() === "ztoa") {
      sortDirection = -1;
    }

    const query: any = { name: { $regex: `^${search}`, $options: "i" } };
    if (parentId) query.parentCategory = parentId;
    else query.parentCategory = null;

    const { data, pagination } = await getPaginatedData({
      model: Category,
      query,
      page,
      limit,
      sort: { name: sortDirection },
    });

    const dataWithImages = data.map((category: any) => {
      return { ...category, imageUrl: getImageUrl(category.image) };
    });

    return res.status(201).json({
      success: true,
      message: "",
      data: dataWithImages,
      pagination,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, description, slug } = req.body;
    const { id } = req.params;
    const { parentCategory } = req.query;

    const categoryToUpdate = await Category.findById(id);
    if (!categoryToUpdate) return next(throwError("Category not found", 404));

    let image;
    if (req.file) {
      const { filename, response } = await uploadFile(req.file!);
      if (!response) return next(throwError("Failed to upload image", 500));
      image = filename;

      // Remove the old image
      await removeFile(categoryToUpdate.image);
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
        slug,
        image,
        parentCategory: parentCategory || null,
      },
      { new: true }
    );

    if (!category) return next(throwError("Category not found", 404));

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return next(error);
  } finally {
    session.endSession();
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const categoryToDelete = await Category.findById(id);
    if (!categoryToDelete) {
      return next(throwError("Category not found", 404));
    }

    // Remove from child category if it is a parent of another category
    await Category.updateMany(
      { parentCategory: id },
      { $unset: { parentCategory: 1 } }
    );

    // Delete the category itself
    const category = await Category.findByIdAndDelete(id);
    if (!category) return next(throwError("Category not found", 404));

    await removeFile(category.image);

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return next(error);
  } finally {
    session.endSession();
  }
};

export const getCategoryNames = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const categories = await Category.find({}, "_id name");
    if (!categories) return next(throwError("Categories not found", 404));
    return res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
