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

dotenv.config();

const startServer = (port: number) => {
 const httpServer = http.createServer(app);
 initializeSocket(httpServer);
 setupInboxNotificationHandlers();

 const serverInstance = httpServer.listen(port, async () => {
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
     await startAllJobs();
     await scheduleRecurringJobs();
   } catch (error) {
     console.error("Failed to start background jobs:", error);
   }
   console.log(`Server running on port ${port}`);
 });

 serverInstance.on("error", async (error: NodeJS.ErrnoException) => {
   if (error.code === "EADDRINUSE") {
     const fallbackPort = port + 1;
     console.warn(`Port ${port} is already in use. Retrying on ${fallbackPort}...`);
     process.env.PORT = String(fallbackPort);
     httpServer.close();
     server = startServer(fallbackPort);
     return;
   }

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
