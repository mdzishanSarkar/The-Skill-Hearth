import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import adminRoutes from "./routes/admin";
import skillRoutes from "./routes/skills";
import discoveryRoutes from "./routes/discovery";
import reportRoutes from "./routes/reports";
import reviewRoutes from "./routes/reviews";
import connectionRoutes from "./routes/connections";
import messageRoutes from "./routes/messages";
import notificationRoutes from "./routes/notifications";
import oauthRoutes from "./routes/oauth";
import endorsementRoutes from "./routes/endorsements";
import swapRoutes from "./routes/swaps";
import suggestionRoutes from "./routes/suggestions";
import bundleRoutes from "./routes/bundles";
import blockOutDateRoutes from "./routes/blockOutDates";
import discoveryEnhancedRoutes from "./routes/discoveryEnhanced";
import messageEnhancedRoutes from "./routes/messageEnhanced";
import sessionRoutes from "./routes/sessions";
import savedSearchRoutes from "./routes/savedSearches";
import { globalRateLimiter } from "./middleware/rateLimit";
import { UPLOADS_DIR } from "./utils/upload";

dotenv.config();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(globalRateLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/endorsements", endorsementRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/blockout-dates", blockOutDateRoutes);
app.use("/api/discover", discoveryEnhancedRoutes);
app.use("/api/chat", messageEnhancedRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/saved-searches", savedSearchRoutes);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message } });
});

export default app;
