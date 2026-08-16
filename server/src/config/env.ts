import dotenv from "dotenv";

dotenv.config();

const parseClientUrls = () => {
  const candidates = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  const urls = candidates
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(urls)];
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrls: parseClientUrls(),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  siteUrl: process.env.SITE_URL || "http://localhost:5000",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/skillshare-local",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
} as const;

export default env;
