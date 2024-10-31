import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/routes.js"

dotenv.config();

console.log("CORS Origin:", process.env.CORS_ORIGIN);
const corsOrigin = process.env.CORS_ORIGIN || "*";

const app = express();

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

export default app;