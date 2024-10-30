import dotenv from "dotenv";
dotenv.config();

import app from "./app.js"

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});