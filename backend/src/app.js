const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");
const { API_VERSION } = require("./utils/apiResponse");

const app = express();

app.use(cors());
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
