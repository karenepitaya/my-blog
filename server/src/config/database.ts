import mongoose from "mongoose";

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DBNAME;
const host = process.env.MONGO_HOST || "127.0.0.1";
const port = process.env.MONGO_PORT || "27017";

const mongoUri = `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=${dbName}`;

export const connectDB = async () => {
  console.log("ENV CHECK:", username, password, dbName);
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB Connected.");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1); // 连接失败 → 直接退出
  }
};

