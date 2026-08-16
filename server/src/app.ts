import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";

const buildAllowedOrigins = () => {
  const configured = (process.env.CLIENT_URL ?? process.env.CLIENT_URLS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  return [...new Set([...configured, ...defaults])];
};

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
import searchRoutes from "./routes/search";
import messageEnhancedRoutes from "./routes/messageEnhanced";
import sessionRoutes from "./routes/sessions";
import savedSearchRoutes from "./routes/savedSearches";
import skillRadarRoutes from "./routes/skillRadar";
import swapReadyMatchesRoutes from "./routes/swapReadyMatches";
import skillDemandRoutes from "./routes/skillDemand";
import communityRoutes from "./routes/community";
import groupSessionRoutes from "./routes/groupSessions";
import blockRoutes from "./routes/block";
import billingRoutes from "./routes/billing";
import courseRoutes from "./routes/courses";
import challengeRoutes from "./routes/challenges";
import mentorshipRoutes from "./routes/mentorships";
import showcaseRoutes from "./routes/showcase";
import webhookRoutes from "./routes/webhooks";
import apiPublicRoutes from "./routes/apiPublic";
import calendarRoutes from "./routes/calendars";
import botRoutes from "./routes/bots";
import friendRoutes from "./routes/friends";
import feedRoutes from "./routes/feed";
import gamificationRoutes from "./routes/gamification";
import dmRoutes from "./routes/dms";
import journalRoutes from "./routes/journal";
import requestTemplateRoutes from "./routes/requestTemplates";
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
    origin: (origin, callback) => {
      const allowedOrigins = buildAllowedOrigins();

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin);
      if (isLocalDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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
app.use("/api/search", searchRoutes);
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
app.use("/api/skill-radar", skillRadarRoutes);
app.use("/api/swap-ready-matches", swapReadyMatchesRoutes);
app.use("/api/skill-demand", skillDemandRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/group-sessions", groupSessionRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/mentorships", mentorshipRoutes);
app.use("/api/showcase", showcaseRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/integrations", apiPublicRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/bots", botRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/dms", dmRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/request-templates", requestTemplateRoutes);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message } });
});

export default app;
