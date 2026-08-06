import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./models/db";
import { seedCategories } from "./services/skill";
import { initializeSocket } from "./config/socket";
import { startAllJobs, scheduleRecurringJobs } from "./jobs";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initializeSocket(httpServer);

const server = httpServer.listen(PORT, async () => {
  await connectDatabase();
  try {
    await seedCategories();
    console.log("Skill categories seeded");
  } catch (error) {
    console.error("Failed to seed skill categories:", error);
  }
  try {
    await startAllJobs();
    await scheduleRecurringJobs();
  } catch (error) {
    console.error("Failed to start background jobs:", error);
  }
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  server.close();
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  server.close();
  await disconnectDatabase();
  process.exit(0);
});

export default server;
