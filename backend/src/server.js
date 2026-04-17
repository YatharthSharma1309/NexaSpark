const app = require("./app");
const connectDb = require("./config/db");
const env = require("./config/env");

const startServer = async () => {
  await connectDb();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Unable to start server:", error.message);
  process.exit(1);
});
