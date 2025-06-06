const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const DeepgramService = require("./services/DeepgramService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// HTTP health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log("WebSocket server running on port 8080");
});

const deepgramService = new DeepgramService(process.env.DEEPGRAM_API_KEY);

wss.on("connection", (ws) => {
  console.log("Client connected");
  deepgramService.handleWebSocketConnection(ws);
});