import express  from "express";
import userRoute from "./routes/user.js"
import productRoute from "./routes/products.js";
import paymentRoute from "./routes/payment.js"
import orderRoute from "./routes/orders.js";
import statsRoute from "./routes/stats.js"
import { connectDB } from "./utils/features.js";
import dotenv from "dotenv"
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import morgan from "morgan";
import cors from "cors";
import Stripe from "stripe";

dotenv.config({ path: ".env" });

const MONGOURL = process.env.MONGO_URL || "fvgfdgfd";
const stripeKey = process.env.STRIPE_KEY || "";
const PORT = process.env.PORT || 3000
const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

export const stripe = new Stripe(stripeKey)

connectDB(MONGOURL);

export const myCache = new NodeCache();


app.get("/",(req,res)=>{
    res.status(200).send("App working")
})

app.use("/api/v1/user",userRoute)
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order",orderRoute)
app.use("/api/v1/payment",paymentRoute)
app.use("/api/v1/dashboard",statsRoute)

app.use("/uploads",express.static("uploads"))
app.use(errorMiddleware);
app.listen(PORT,()=>{
    console.log(`app  running on port ${PORT}`)
})