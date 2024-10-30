import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on("error", (err, client) => {
  console.error(
    `Unexpected pool client error: ${err}. Current state of the client: ${client.readyState}`
  );
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);