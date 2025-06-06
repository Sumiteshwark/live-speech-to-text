const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const { createClient } = require("@deepgram/sdk");
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

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

wss.on("connection", (ws) => {
  console.log("Client connected");
  let deepgramLive = null;

  ws.on("message", async (message, isBinary) => {
    if (isBinary) {
      if (deepgramLive && deepgramLive.getReadyState() === 1) {
        deepgramLive.send(message);
      }
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      console.log("Received message:", data);

      if (data.type === "start") {
        console.log("Starting live transcription...");

        deepgramLive = deepgram.listen.live({
          model: "nova-2",
          encoding: "linear16",
          sample_rate: 16000,
          channels: 1,
          interim_results: true,
          smart_format: true,
          endpointing: 300,
        });

        deepgramLive.on("Results", (result) => {
          const transcript = result.channel.alternatives[0]?.transcript || "";
          if (transcript) {
            ws.send(
              JSON.stringify({
                type: "transcript",
                transcript,
                is_final: result.is_final,
                speech_final: result.speech_final,
              })
            );
          }
        });

        deepgramLive.on("error", (error) => {
          console.error("Deepgram error:", error);
          ws.send(JSON.stringify({ type: "error", message: "Transcription error" }));
        });

        deepgramLive.on("close", () => {
          console.log("Deepgram stream closed");
        });

      } else if (data.type === "stop") {
        console.log("Stopping transcription...");
        if (deepgramLive) {
          deepgramLive.finish();
          deepgramLive = null;
        }
      }
    } catch (err) {
      console.error("Message handling error:", err);
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (deepgramLive) {
      deepgramLive.finish();
    }
  });
});



// const express = require("express");
// const cors = require("cors");
// const WebSocket = require("ws");
// const { createClient } = require("@deepgram/sdk");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Initialize Deepgram client
// const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// // WebSocket server for handling audio streams
// const wss = new WebSocket.Server({ port: 8080 });

// wss.on("connection", (ws) => {
//   console.log("Client connected");

//   let deepgramLive = null;

//   ws.on("message", async (message) => {
//     try {
//       const data = JSON.parse(message);
//       console.log("Received message:", data.type);

//       if (data.type === "start") {
//         console.log("Starting live transcription...");

//         // Create Deepgram live connection
//         deepgramLive = deepgram.listen.live({
//             model: 'nova-3',
//             // language: 'en-US',
//             smart_format: true,
//             interim_results: true,
//             endpointing: 300,
//             utterance_end_ms: 1000,
//             encoding: 'linear16',
//             sample_rate: 16000,
//             channels: 1
//         });

//         // Handle Deepgram responses
//         deepgramLive.on("Results", (data) => {
//           console.log("Deepgram results:", data.channel.alternatives);
//           const transcript = data.channel.alternatives[0].transcript;

//           console.log("Deepgram transcript:", transcript);

//           if (transcript && transcript.length > 0) {
//             ws.send(
//               JSON.stringify({
//                 type: "transcript",
//                 transcript: transcript,
//                 is_final: data.is_final,
//                 speech_final: data.speech_final,
//               })
//             );
//           }
//         });

//         deepgramLive.on("error", (error) => {
//           console.error("Deepgram error:", error);
//           ws.send(
//             JSON.stringify({
//               type: "error",
//               message: "Transcription error occurred",
//             })
//           );
//         });

//         deepgramLive.on("close", () => {
//           console.log("Deepgram connection closed");
//         });
//       } else if (data.type === "audio") {
//         // Send audio data to Deepgram
//         if (deepgramLive && deepgramLive.getReadyState() === 1) {
//           const audioBuffer = Buffer.from(data.audio, "base64");
//           deepgramLive.send(audioBuffer);
//         }
//       } else if (data.type === "stop") {
//         console.log("Stopping live transcription...");
//         if (deepgramLive) {
//           deepgramLive.finish();
//           deepgramLive = null;
//         }
//       }
//     } catch (error) {
//       console.error("Error processing message:", error);
//       ws.send(
//         JSON.stringify({
//           type: "error",
//           message: "Error processing audio data",
//         })
//       );
//     }
//   });

//   ws.on("close", () => {
//     console.log("Client disconnected");
//     if (deepgramLive) {
//       deepgramLive.finish();
//     }
//   });
// });

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.json({ status: "Server is running" });
// });

// app.listen(PORT, () => {
//   console.log(`Express server running on port ${PORT}`);
//   console.log(`WebSocket server running on port 8080`);
// });
