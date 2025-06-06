import React, { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

function App() {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const mediaRef = useRef(null);
  const audioRef = useRef(null);

  // Setup WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcript") {
          console.log("Transcript received:", data);
          if (data.is_final) {
            setTranscript((prev) => prev + data.transcript + " ");
            setInterim("");
          } else {
            setInterim(data.transcript);
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const int16Array = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(int16Array.buffer);
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    mediaRef.current = { context: audioContext, source, processor };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start" }));
      console.log("Started recording and sent start message");
    }

    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRef.current) {
      mediaRef.current.processor.disconnect();
      mediaRef.current.source.disconnect();
      mediaRef.current.context.close();
      console.log("Stopped audio context");
    }

    if (audioRef.current) {
      audioRef.current.getTracks().forEach((track) => track.stop());
      console.log("Microphone tracks stopped");
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      console.log("Sent stop message to WebSocket");
    }

    setRecording(false);
    setInterim("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-start">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Live Speech to Text</h1>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ${
          recording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {recording ? <Square size={20} /> : <Mic size={20} />}
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      <div className="mt-6 bg-white rounded-xl shadow-md p-6 w-full max-w-2xl">
        <p className="text-sm text-gray-500 mb-2">Transcript:</p>
        <div className="whitespace-pre-wrap text-gray-800 min-h-[100px]">
          <strong>{transcript}</strong>
          <span className="text-gray-400 italic">{interim}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        WebSocket:{" "}
        <span className={connected ? "text-green-600" : "text-red-600"}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </p>
    </div>
  );
}

export default App;