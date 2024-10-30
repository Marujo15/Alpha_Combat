
import pg from "pg";
const { Pool } = pg
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../config/index.js";

const poolConfig = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT, 10),
};

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
    console.error(`Unexpected error in connection pool: ${err.message}`);
    process.exit(1);
});

export const query = (text, params) => pool.query(text, params);

// Note: QueryResultRow is an interface that represents a row returned by the database, where each column is a key-value pair.