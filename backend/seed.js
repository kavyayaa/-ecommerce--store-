const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("./src/config/db");
const Product = require("./src/models/Product");
const User = require("./src/models/User");
const sampleProducts = require("./src/utils/sampleProducts");

dotenv.config({ path: path.join(__dirname, ".env") });

const seed = async () => {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(sampleProducts);

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("Missing ADMIN_EMAIL in backend/.env");
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    {
      name: "Store Admin",
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: "admin"
    },
    { upsert: true, new: true }
  );

  console.log("Seed complete: products + admin user (password: admin123)");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
