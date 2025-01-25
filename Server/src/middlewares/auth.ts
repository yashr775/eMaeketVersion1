import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;
console.log(id)
  if (!id) return next(new ErrorHandler("Admin Only", 401));

  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User Not Found", 401));

  if (user.role !== "admin")
    return next(new ErrorHandler("You are not allowed", 400));

  next()
});
