import fs from "node:fs";
import path from "node:path";
import { Sequelize } from "sequelize";

const dialect = process.env.DB_DIALECT || "sqlite";

export let sequelize;

if (dialect === "postgres") {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else if (dialect === "mysql") {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      dialect: "mysql",
      logging: false,
    },
  );
} else if (dialect === "sqlite") {
  const storage = path.resolve(process.env.SQLITE_PATH || "./data/cms.sqlite");

  fs.mkdirSync(path.dirname(storage), { recursive: true });

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage,
    logging: false,
  });
} else {
  throw new Error(`Unsupported database dialect: ${dialect}`);
}

export default sequelize;
