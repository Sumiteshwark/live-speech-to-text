import React, { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

function VoskSTT() {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null); 
  const sourceNodeRef = useRef(null); 
  const processorNodeRef = useRef(null);

  const VOSK_SAMPLE_RATE = 16000;

  useEffect(() => {
    const websocketUrl = "ws://localhost:8000"; 
    
    const ws = new WebSocket(websocketUrl);
    ws.binaryType = "arraybuffer"; 

    ws.onopen = () => {
      console.log("WebSocket connected to Vosk server");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected from Vosk server");
      setConnected(false);
      cleanupAudioNodes(); 
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      setConnected(false);
      cleanupAudioNodes(); 
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data); 
        console.log("Vosk server message:", data); 

        if (data.type === "partial") {
          setInterim(data.text);
        } else if (data.type === "final") {
          setTranscript((prev) => prev + data.text + " ");
          setInterim("");
        } else if (data.type === "error") {
            console.error("Vosk server error:", data.message);
            setTranscript((prev) => prev + `[ERROR: ${data.message}] `);
            setInterim("");
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    wsRef.current = ws; 
    
    return () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }
        cleanupAudioNodes(); 
    };
  }, []);

  const startRecording = async () => {
    if (recording || !connected) {
      console.log("Already recording or not connected.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      const inputSampleRate = audioContextRef.current.sampleRate;
      console.log(`Browser's actual audio input sample rate: ${inputSampleRate} Hz`);
      console.log(`Vosk expected sample rate: ${VOSK_SAMPLE_RATE} Hz`);

      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorNodeRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorNodeRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0); 

        const resampledData = resampleAudio(inputData, inputSampleRate, VOSK_SAMPLE_RATE);
        
        const int16Array = new Int16Array(resampledData.length);
        for (let i = 0; i < resampledData.length; i++) {
          const s = Math.max(-1, Math.min(1, resampledData[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(int16Array.buffer);
        }
      };

      sourceNodeRef.current.connect(processorNodeRef.current);
      processorNodeRef.current.connect(audioContextRef.current.destination);

      setRecording(true); 
      console.log("Started recording and streaming audio.");

    } catch (error) {
      console.error("Error starting recording:", error);
      setRecording(false);
      setTranscript((prev) => prev + `[Error: ${error.message}] `);
      cleanupAudioNodes(); 
    }
  };

  const stopRecording = () => {
    if (!recording) return;

    cleanupAudioNodes();

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
            console.log("AudioContext closed.");
        }).catch(err => console.error("Error closing AudioContext:", err));
    }

    if (sourceNodeRef.current && sourceNodeRef.current.mediaStream) {
      sourceNodeRef.current.mediaStream.getTracks().forEach((track) => track.stop());
      console.log("Microphone tracks stopped.");
    }

    setRecording(false); 
    setInterim(""); 
    console.log("Stopped recording.");
  };

  const cleanupAudioNodes = () => {
    if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
  };

  const resampleAudio = (audioBuffer, inputSampleRate, outputSampleRate) => {
    if (inputSampleRate === outputSampleRate) {
      return audioBuffer; 
    }

    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.ceil(audioBuffer.length / ratio);
    const resampledBuffer = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; ++i) {
      const index = i * ratio;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;

      if (upper >= audioBuffer.length) {
        resampledBuffer[i] = audioBuffer[lower];
      } else {
        resampledBuffer[i] = audioBuffer[lower] * (1 - weight) + audioBuffer[upper] * weight;
      }
    }
    return resampledBuffer;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-start">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Live Speech to Text (Vosk)</h1>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ${
          recording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
        } ${!connected && !recording ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!connected && !recording}
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
        WebSocket Status:{" "}
        <span className={connected ? "text-green-600" : "text-red-600"}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </p>
      <p className="mt-2 text-xs text-gray-500 text-center max-w-lg">
          *Audio is automatically resampled to 16kHz for Vosk, but clear speech and quiet environments are key.
      </p>
    </div>
  );
}

export default VoskSTT;
