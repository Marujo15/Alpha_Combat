import app, { startServer } from "./app.js";
import { PORT } from "./config/index.js";

const port = PORT ? parseInt(PORT) : 3000;

const startApp = async () => {
  await startServer();
  app.listen(port, () => {
    console.log(`Server running on the port ${port}`);
  });
};

startApp();