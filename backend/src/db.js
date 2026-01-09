import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/simverse";
  try {
    await mongoose.connect(uri, {
      // useNewUrlParser, useUnifiedTopology are defaults in modern mongoose
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.warn("MongoDB connection failed; continuing without DB:", err.message);
  }
}
