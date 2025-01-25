import express from "express";
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getCoupon,
  newCoupon,
  updateCoupon,
} from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/coupon/new", newCoupon);
app.get("/discount", applyDiscount);
app.get("/coupon/all", adminOnly, allCoupons);
app.post("/create", createPaymentIntent);

app
  .route("/coupon/:id")
  .get(adminOnly, getCoupon)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);

export default app;
