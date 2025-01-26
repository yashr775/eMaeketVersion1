import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import{Review} from "../models/review.js";
import {User} from "../models/user.js"
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";
import { deleteFromCloudinary, findAverageRatings, invalidateCache, uploadToCloudinary } from "../utils/features.js";
// import { faker } from "@faker-js/faker";

const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category, description } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;
    

    if (!photos) next(new ErrorHandler("Please add photo", 400));
    
    if (photos!.length < 1) next(new ErrorHandler("Please add at least one photo", 400));
    
    if (photos!.length > 5) next(new ErrorHandler("Please add  only upto five photos", 400));

    if (!name || !price || !stock || !category || !description) {
      next(new ErrorHandler("Please enter All Fields", 400));
    }
    
    const photosURL =await uploadToCloudinary(photos!);

    const product = await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photos: photosURL,
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
  const photos = req.files as Express.Multer.File[] | undefined;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (photos && photos.length > 0) {
    const photosURL = await uploadToCloudinary(photos);

    const ids = product.photos.map((photo) => photo.public_id);

    await deleteFromCloudinary(ids);

    product.photos = photosURL;
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

  const ids = product.photos.map((photo) => photo.public_id);

  await deleteFromCloudinary(ids);
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

const allReviewsOfProduct = TryCatch(async (req, res, next) => {
  
    const reviews = await Review.find({
      product: req.params.id,
    })
      .populate("user", "name photo")
      .sort({ updatedAt: -1 });

  return res.status(200).json({
    success: true,
    reviews,
  });
});

const newReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);

  if (!user) return next(new ErrorHandler("Not Logged In", 404));

  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const { comment, rating } = req.body;

  const alreadyReviewed = await Review.findOne({
    user: user._id,
    product: product._id,
  });

  if (alreadyReviewed) {
    alreadyReviewed.comment = comment;
    alreadyReviewed.rating = rating;

    await alreadyReviewed.save();
  } else {
    await Review.create({
      comment,
      rating,
      user: user._id,
      product: product._id,
    });
  }

  const { ratings, numOfReviews } = await findAverageRatings(product._id);

  product.ratings = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
    review: true,
  });

  return res.status(alreadyReviewed ? 200 : 201).json({
    success: true,
    message: alreadyReviewed ? "Review Update" : "Review Added",
  });
});


const deleteReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);

  if (!user) return next(new ErrorHandler("Not Logged In", 404));

  const review = await Review.findById(req.params.id);
  if (!review) return next(new ErrorHandler("Review Not Found", 404));

  const isAuthenticUser = review.user.toString() === user._id.toString();

  if (!isAuthenticUser) return next(new ErrorHandler("Not Authorized", 401));

  await review.deleteOne();

  const product = await Product.findById(review.product);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const { ratings, numOfReviews } = await findAverageRatings(product._id);

  product.ratings = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();
  
  await invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
    review:true
  });

  return res.status(200).json({
    success: true,
    message: "Review Deleted",
  });
});

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
  allReviewsOfProduct,
  newReview,
  deleteReview
};
