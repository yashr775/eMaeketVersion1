import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
// import { faker } from "@faker-js/faker";

const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category, description } = req.body;
    const photo = req.file;

    if (!photo) next(new ErrorHandler("Please add photo", 400));
    if (!name || !price || !stock || !category || !description) {
      if (photo?.path)
        rm(photo?.path, () => {
          console.log("file deleted");
        });
      next(new ErrorHandler("Please enter All Fields", 400));
    }

    const product = await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photos: photo?.path,
      description,
    });
invalidateCache({product:true})
    return res
      .status(201)
      .json({ success: true, message: "Product is created" });
  }
);

const getLatestProducts = TryCatch(async (req, res, next) => {
  let products = [];

  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-produucts")!);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);

    myCache.set("latest-product", JSON.stringify(products));
  }

  return res.status(200).json({ message: "Latest five products", products });
});

const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
 

  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories")!);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  invalidateCache({product:true})
  return res.status(200).json({ message: "List of Categories", categories });
});

const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products")!);
  } else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

const getSingleProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;

  let product;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`)!);
  } else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
    myCache.set(`product-${id}`, JSON.stringify(product));
  }
  return res.status(200).json({
    success: true,
    product,
  });
});

const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category, description } = req.body;
  const photos = req.file;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (photos) {
    rm(product.photos!, () => {
      console.log("old photo deleted");
    });
    product.photos = photos.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;
  if (description) product.description = description;

  invalidateCache({product:true,productId:String(product._id)})

  await product.save();

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

const deleteProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  rm(product.photos!, () => {
    console.log("Product photo deleted");
  });

  await product.deleteOne();
  invalidateCache({ product: true, productId: String(product._id) });
  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip = (page - 1) * limit;

    let products;
    let totalPage;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [productsFetched, filteredOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    products = productsFetched;

    totalPage = Math.ceil(products.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photos: "uploads\\e8abbac9-db09-4849-ab29-5eb63d040b77.jpg",
//       description: faker.commerce.productDescription(),
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };

// generateRandomProducts(40);

// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };

// deleteRandomsProducts(38)

export {
  newProduct,
  getLatestProducts,
  getAllCategories,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
};
