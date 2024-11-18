import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { WebSocketServer } from 'ws';
import { initWebSocket } from './network/index.js';
import routes from "./routes/routes.js";

const options = {
  cert: fs.readFileSync('/etc/letsencrypt/live/alpha03.alphaedtech.org.br/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/alpha03.alphaedtech.org.br/privkey.pem'),
};

dotenv.config();
const app = express();

const server = https.createServer(options, app);
const wss = new WebSocketServer({ server });

initWebSocket(wss);

const corsOptions = {
  origin: 'https://alpha03.alphaedtech.org.br',
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});

export default server;