import sequelize from "./db.js";

async function testDatabase() {
  try {
    await sequelize.authenticate();

    console.log("Neon PostgreSQL connected successfully!");

    console.log("Database:", sequelize.getDialect());
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await sequelize.close();
  }
}

testDatabase();
