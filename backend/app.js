import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http"
import { WebSocketServer } from 'ws';
import { initWebSocket } from './network/index.js';
import routes from "./routes/routes.js"

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

initWebSocket(wss)

app.use(
  cors({
    origin:
    [
      'http://208.167.252.106', 
      'http://alpha03.alphaedtech.org.br'
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

export default server;