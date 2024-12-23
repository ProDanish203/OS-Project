import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser, Role } from "../types/type";
import { throwError } from "../utils/helpers";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const verifyAuth = (roles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.token ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return next(throwError("Unauthorized Access", 401));
      }

      const payload = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as jwt.JwtPayload;

      const user = await User.findById(payload?._id).select("-password");

      if (!user) return next(throwError("Unauthorized Access", 401));
      if (!roles.includes(user.role as Role))
        return next(throwError("Unauthorized Access", 401));

      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      next(throwError("Authentication Error", 401));
    }
  };
};
