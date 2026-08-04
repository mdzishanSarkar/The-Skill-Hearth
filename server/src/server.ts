import dotenv from "dotenv";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./models/db";
import { seedCategories } from "./services/skill";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  await connectDatabase();
  try {
    await seedCategories();
    console.log("Skill categories seeded");
  } catch (error) {
    console.error("Failed to seed skill categories:", error);
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
