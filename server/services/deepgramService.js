const { createClient } = require("@deepgram/sdk");

class DeepgramService {
  constructor(apiKey) {
    this.deepgram = createClient(apiKey);
  }

  handleWebSocketConnection(ws) {
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
          deepgramLive = this.startTranscription(ws);
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
  }

  startTranscription(ws) {
    const deepgramLive = this.deepgram.listen.live({
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

    return deepgramLive;
  }
}

module.exports = DeepgramService; 