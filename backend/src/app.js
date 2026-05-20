const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { buildCorsOptions } = require("./config/cors");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");
const { API_VERSION } = require("./utils/apiResponse");

const app = express();

app.set("trust proxy", 1);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "8mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Healthcare API",
    data: { docs: "REST: /api/..." },
    apiVersion: API_VERSION,
  });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
