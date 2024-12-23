import { Request, Response, NextFunction } from "express";
import { verifyAuth } from "./auth.middleware";
import { ROLES } from "../utils/constants";

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  if (token) return verifyAuth(Object.values(ROLES))(req, res, next);
  next();
};
