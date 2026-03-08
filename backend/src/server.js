const path = require("path");
const dotenv = require("dotenv");
// LOAD ENV FIRST
dotenv.config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const Product = require("./models/Product");
const sampleProducts = require("./utils/sampleProducts");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");
const { checkoutRouter, handleStripeWebhook } = require("./routes/checkout");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const port = process.env.PORT;
if (!port) {
  throw new Error("Missing PORT in backend/.env");
}

const app = express();

app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(cors({ origin: process.env.CORS_ORIGINS?.split(",") || ["*"] }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ message: "MEN ecommerce backend running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/checkout", checkoutRouter);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const startServer = async () => {
  await connectDB();

  const productsCount = await Product.countDocuments();
  if (productsCount === 0) {
    await Product.insertMany(sampleProducts);
    console.log("Sample products seeded automatically.");
  }

  app.listen(Number(port), "0.0.0.0", () => {
    console.log(`Backend running on 0.0.0.0:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
