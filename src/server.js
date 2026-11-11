import "dotenv/config";
// import app from "./app.js";
// import sequelize from "./config/db.js";
import "./models.js";
import { sequelize } from "./db.js";
import express from "express";

const PORT = process.env.PORT || 5000;
const app = express();

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync();
    console.log("Database tables synchronized");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
