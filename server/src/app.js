require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  path = require("path");
const auth = require("./routes/auth"),
  products = require("./routes/products"),
  cart = require("./routes/cart"),
  orders = require("./routes/orders"),
  admin = require("./routes/admin"),
  categories = require("./routes/categories");
const { prisma } = require("./lib");
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.get("/api/health", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: "CloudCart API and database are running" });
  } catch (error) {
    console.error("Database health check failed", error.message);
    res
      .status(503)
      .json({ success: false, message: "CloudCart database is unavailable" });
  }
});
app.use("/api/auth", auth);
app.use("/api/products", products);
app.use("/api/categories", categories);
app.use("/api/cart", cart);
app.use("/api/orders", orders);
app.use("/api/admin", admin);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Something went wrong" });
});
module.exports = app;
