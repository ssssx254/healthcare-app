const { app } = require("../app");
const { env } = require("../config/env");

function startServer() {
  const server = app.listen(env.port, env.host, () => {
    const hostForLog = env.host === "0.0.0.0" ? "localhost" : env.host;
    console.log(`API listening on http://${hostForLog}:${env.port} (bound ${env.host})`);
    console.log(`Health: http://${hostForLog}:${env.port}/api/health`);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });

  return server;
}

module.exports = { startServer };

