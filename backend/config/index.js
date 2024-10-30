import { config } from "dotenv";

config();

export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_NAME = process.env.DB_NAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_PORT = process.env.DB_PORT || '5432';
export const SECRET_KEY = process.env.SECRET_KEY || 'random_secret_password';
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const PORT = process.env.PORT || '3000';