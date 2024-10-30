import { CORS_ORIGIN } from "./config/index.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/routes.js";
import { pool } from "./database/database.js";

console.log("CORS Origin:", CORS_ORIGIN);

const app = express();

const corsOrigin = CORS_ORIGIN || "*";

app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

export const startServer = async () => {
    try {
        await pool.connect();
        console.log("Database connection established");
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
};

export default app;
