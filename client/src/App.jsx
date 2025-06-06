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




// import React, { useState, useRef, useEffect } from 'react';
// import { Mic, MicOff, Square } from 'lucide-react';

// export default function LiveSpeechToText() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [interimTranscript, setInterimTranscript] = useState('');
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState('');

//   const wsRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioStreamRef = useRef(null);

//   // Initialize WebSocket connection
//   useEffect(() => {
//     const connectWebSocket = () => {
//       wsRef.current = new WebSocket('ws://localhost:8080');
      
//       wsRef.current.onopen = () => {
//         console.log('WebSocket connected');
//         setIsConnected(true);
//         setError('');
//       };
      
//       wsRef.current.onmessage = (event) => {
//         const data = JSON.parse(event.data);
        
//         if (data.type === 'transcript') {
//           if (data.is_final) {
//             setTranscript(prev => prev + data.transcript + ' ');
//             setInterimTranscript('');
//           } else {
//             setInterimTranscript(data.transcript);
//           }
//         } else if (data.type === 'error') {
//           setError(data.message);
//           console.error('Transcription error:', data.message);
//         }
//       };
      
//       wsRef.current.onclose = () => {
//         console.log('WebSocket disconnected');
//         setIsConnected(false);
//         // Attempt to reconnect after 3 seconds
//         setTimeout(connectWebSocket, 3000);
//       };
      
//       wsRef.current.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         setError('Connection error. Please check if the server is running.');
//       };
//     };

//     connectWebSocket();

//     return () => {
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, []);

//   const startRecording = async () => {
//     try {
//       setError('');
      
//       // Get microphone access
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           sampleRate: 16000,
//           channelCount: 1,
//           echoCancellation: true,
//           noiseSuppression: true
//         }
//       });
      
//       audioStreamRef.current = stream;
      
//       // Create MediaRecorder for capturing audio
//       const mediaRecorder = new MediaRecorder(stream, {
//         mimeType: 'audio/webm;codecs=opus'
//       });
      
//       mediaRecorderRef.current = mediaRecorder;

//       // Handle audio data
//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//           // Convert blob to base64 and send to server
//           const reader = new FileReader();
//           reader.onload = () => {
//             const base64Audio = reader.result.split(',')[1];
//             wsRef.current.send(JSON.stringify({
//               type: 'audio',
//               audio: base64Audio
//             }));
//           };
//           reader.readAsDataURL(event.data);
//         }
//       };

//       // Start recording
//       mediaRecorder.start(100); // Send data every 100ms
      
//       // Tell server to start transcription
//       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//         wsRef.current.send(JSON.stringify({ type: 'start' }));
//       }
      
//       setIsRecording(true);
      
//     } catch (err) {
//       console.error('Error starting recording:', err);
//       setError('Could not access microphone. Please ensure microphone permissions are granted.');
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//     }
    
//     if (audioStreamRef.current) {
//       audioStreamRef.current.getTracks().forEach(track => track.stop());
//     }
    
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ type: 'stop' }));
//     }
    
//     setIsRecording(false);
//     setInterimTranscript('');
//   };

//   const clearTranscript = () => {
//     setTranscript('');
//     setInterimTranscript('');
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(transcript);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white rounded-lg shadow-lg p-6">
//           <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
//             Live Speech to Text
//           </h1>
          
//           {/* Connection Status */}
//           <div className="flex items-center justify-center mb-6">
//             <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
//               isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//             }`}>
//               <div className={`w-2 h-2 rounded-full mr-2 ${
//                 isConnected ? 'bg-green-500' : 'bg-red-500'
//               }`}></div>
//               {isConnected ? 'Connected' : 'Disconnected'}
//             </div>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
//               {error}
//             </div>
//           )}

//           {/* Recording Controls */}
//           <div className="flex justify-center gap-4 mb-8">
//             {!isRecording ? (
//               <button
//                 onClick={startRecording}
//                 disabled={!isConnected}
//                 className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//               >
//                 <Mic size={20} />
//                 Start Recording
//               </button>
//             ) : (
//               <button
//                 onClick={stopRecording}
//                 className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//               >
//                 <Square size={20} />
//                 Stop Recording
//               </button>
//             )}
            
//             <button
//               onClick={clearTranscript}
//               className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//             >
//               Clear
//             </button>
            
//             {transcript && (
//               <button
//                 onClick={copyToClipboard}
//                 className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//               >
//                 Copy Text
//               </button>
//             )}
//           </div>

//           {/* Recording Indicator */}
//           {isRecording && (
//             <div className="flex items-center justify-center mb-6">
//               <div className="flex items-center text-red-600">
//                 <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
//                 <span className="text-sm font-medium">Recording in progress...</span>
//               </div>
//             </div>
//           )}

//           {/* Transcript Display */}
//           <div className="bg-gray-50 border rounded-lg p-6 min-h-[300px]">
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">Transcript</h2>
//             <div className="text-gray-800 leading-relaxed">
//               {transcript && (
//                 <span className="text-gray-800">{transcript}</span>
//               )}
//               {interimTranscript && (
//                 <span className="text-gray-500 italic">{interimTranscript}</span>
//               )}
//               {!transcript && !interimTranscript && (
//                 <span className="text-gray-400">
//                   Start recording to see live transcription here...
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Instructions */}
//           <div className="mt-6 text-sm text-gray-600">
//             <h3 className="font-medium mb-2">Instructions:</h3>
//             <ul className="list-disc list-inside space-y-1">
//               <li>Make sure your server is running on localhost:5000</li>
//               <li>Click "Start Recording" to begin live transcription</li>
//               <li>Speak clearly into your microphone</li>
//               <li>Gray italic text shows interim results</li>
//               <li>Black text shows final transcription results</li>
//               <li>Click "Stop Recording" when finished</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }