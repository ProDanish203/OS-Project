import { Request, Response } from "express";
import { NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getPaginatedData, throwError } from "../utils/helpers";
import { Category } from "../models/category.model";
import { Product } from "../models/product.model";
import { getImageUrl, removeFile, uploadFile } from "../config/storageBucket";

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { name, description, price, category, stock } = req.body;
    if (!name || !description || !price || !category)
      return next(throwError("All fields are required", 400));

    const categoryData = await Category.findById(category);
    if (!categoryData) return next(throwError("Category not found", 404));

    const images = req.files as Express.Multer.File[];
    if (!images) return next(throwError("Images are required", 400));

    let files: string[] = [];
    for (const image of images) {
      const { filename } = await uploadFile(image);
      files.push(filename);
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images: files,
    });

    if (!product) return next(throwError("Product not created", 500));

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

// TODO: Need To Handle images in updateProduct
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;

    if (category) {
      const categoryData = await Category.findById(category);
      if (!categoryData) return next(throwError("Category not found", 404));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        stock,
        category,
      },
      { new: true }
    );

    if (!updatedProduct) return next(throwError("Product not found", 404));

    return res.status(201).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) return next(throwError("Product not found", 404));

    await Promise.all(
      product.images.map(async (image) => {
        await removeFile(image);
      })
    );

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const filter: any = req.query.filter || "";
    let sortDirection = 1;

    if (filter.toLowerCase() === "ztoa") {
      sortDirection = -1;
    }

    const query: any = { name: { $regex: `^${search}`, $options: "i" } };
    const populate = {
      path: "category",
      model: Category,
      select: "name _id",
    };

    const { data, pagination } = await getPaginatedData({
      model: Product,
      query,
      page,
      limit,
      populate,
      sort: { name: sortDirection },
    });

    const dataWithImages = data.map((product: any) => {
      return {
        ...product,
        imageUrls: product.images.map((image: string) => getImageUrl(image)),
      };
    });

    return res.status(200).json({
      success: true,
      message: "All Produts fetched",
      data: dataWithImages,
      pagination,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate({
      path: "category",
      model: Category,
      select: "name _id",
    });

    if (!product) return next(throwError("Product not found", 404));

    const productWithImages = {
      ...product.toJSON(),
      imageUrls: product.images.map((image: string) => getImageUrl(image)),
    };

    return res.status(200).json({
      success: true,
      message: "Product found",
      data: productWithImages,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getProductsByCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) return next(throwError("Category not found", 404));

    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const filter: any = req.query.filter || "";
    let sortDirection = 1;

    if (filter.toLowerCase() === "ztoa") {
      sortDirection = -1;
    }

    const query: any = {
      name: { $regex: `^${search}`, $options: "i" },
      category: id,
    };
    const populate = {
      path: "category",
      model: Category,
      select: "name _id",
    };

    const { data, pagination } = await getPaginatedData({
      model: Product,
      query,
      page,
      limit,
      populate,
      sort: { name: sortDirection },
    });

    const dataWithImages = data.map((product: any) => {
      return {
        ...product,
        imageUrls: product.images.map((image: string) => getImageUrl(image)),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Products found",
      data: dataWithImages,
      pagination,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
