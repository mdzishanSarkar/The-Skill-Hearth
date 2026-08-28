import 'dotenv/config';
import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./models/db";
import { seedCategories } from "./services/skill";
import { initializeSocket } from "./config/socket";
import { setupInboxNotificationHandlers } from "./services/inbox-notification.service";
import { startAllJobs, scheduleRecurringJobs } from "./jobs";
import { runMigrationIfNeeded } from "./migrations/savedSearchToRadar.migration";
import { runSkillRadarNormalizationIfNeeded } from "./migrations/normalizeSkillRadar.migration";

dotenv.config();

const startServer = (port: number) => {
 const httpServer = http.createServer(app);

 const serverInstance = httpServer.listen(port, async () => {
  initializeSocket(httpServer);
  setupInboxNotificationHandlers();
   await connectDatabase();
    try {
      await seedCategories();
      console.log("Skill categories seeded");
    } catch (error) {
      console.error("Failed to seed skill categories:", error);
    }
    try {
      await runMigrationIfNeeded();
    } catch (error) {
      console.error("Failed to run saved search migration:", error);
    }
    try {
      await runSkillRadarNormalizationIfNeeded();
    } catch (error) {
      console.error("Failed to normalize skill radar data:", error);
    }
   try {
     await startAllJobs();
     await scheduleRecurringJobs();
   } catch (error) {
     console.error("Failed to start background jobs:", error);
   }
   console.log(`Server running on port ${port}`);
 });

 serverInstance.on("error", (error: NodeJS.ErrnoException) => {
   console.error("Failed to start server:", error);
   process.exit(1);
 });

 return serverInstance;
};

const requestedPort = Number(process.env.PORT) || 5000;
let server: ReturnType<typeof http.createServer> | undefined = startServer(requestedPort);

process.on("SIGINT", async () => {
 console.log("\nShutting down gracefully...");
 server?.close();
 await disconnectDatabase();
 process.exit(0);
});

process.on("SIGTERM", async () => {
 console.log("\nShutting down gracefully...");
 server?.close();
 await disconnectDatabase();
 process.exit(0);
});

export default server;
