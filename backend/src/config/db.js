const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;

  if (!mongoUrl || !dbName) {
    throw new Error("Missing MONGO_URL or DB_NAME in backend/.env");
  }

  await mongoose.connect(mongoUrl, { dbName });
  console.log(`MongoDB connected to database: ${dbName}`);
};

module.exports = connectDB;