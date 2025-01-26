import express from "express";
import { multiUpload } from "../middlewares/multer.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/new", adminOnly, multiUpload, newProduct);
app.get("/latest", getLatestProducts);
app.get("/categories", getAllCategories);
app.get("/admin-products",adminOnly, getAdminProducts);
app.get("/all", getAllProducts);
app
  .route("/:id")
  .get(getSingleProduct)
  .put(multiUpload, updateProduct)
  .delete(deleteProduct);

export default app;
