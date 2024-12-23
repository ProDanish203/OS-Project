import express from "express";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import { errorMiddleware } from "./middlewares/error.middleware";
import { connectDb } from "./config/dbConnection";
// Routes imports
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import categoryRoute from "./routes/category.route";
import productRoute from "./routes/product.route";
import orderRoute from "./routes/order.route";
import checkoutRoute from "./routes/checkout.route";

config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
// For url inputs
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(morgan("dev"));
app.use(cookieParser());
app.disable("x-powered-by");
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Base Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Inventory Managment System - API",
  });
});

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/checkout", checkoutRoute);

// Middlewares
app.use(errorMiddleware);

// Listen To Server
const PORT = process.env.PORT || 5000;
// Connect To database first then start the server
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Database Connection Error: ${error}`);
  });
