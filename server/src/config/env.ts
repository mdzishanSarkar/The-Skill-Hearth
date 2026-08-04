import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  siteUrl: process.env.SITE_URL || "http://localhost:5000",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/skillshare-local",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
} as const;

export default env;
