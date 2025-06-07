# app.py
import asyncio
import websockets
import json
import vosk
import sys
import os

# Adjust this path if your model is in a different location
MODEL_PATH = "model" # This path is relative to the Docker WORKDIR (/app)
SAMPLE_RATE = 16000 # Vosk models typically expect 16kHz audio

# Load the Vosk model
try:
    model = vosk.Model(MODEL_PATH)
    print("Vosk model loaded successfully.")
except Exception as e:
    print(f"Error loading Vosk model: {e}")
    sys.exit(1)

# Modified: Function signature to accept *args to prevent TypeError
async def recognize_audio(websocket, *args):
    # Create a new recognizer for each connection to handle concurrent clients
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)
    print("WebSocket connection established. Ready for audio stream.")

    # Add a counter for incoming messages
    message_count = 0

    try:
        async for message in websocket:
            message_count += 1
            if isinstance(message, bytes): # Expecting binary audio data
                # Log incoming audio message details
                # print(f"Received audio message {message_count}: size={len(message)} bytes. First 10 bytes: {message[:10].hex()}")

                # Check if the audio data is mostly silence (all zeros)
                is_silent = all(b == 0 for b in message)
                if is_silent:
                    print(f"Received silent audio chunk {message_count}. Skipping recognition attempt.")
                    # Optionally, you could just continue here without passing to Vosk
                    # continue 
                else:
                    # Log that non-silent audio is being sent to Vosk
                    print(f"Received non-silent audio chunk {message_count}. Attempting Vosk recognition.")
                    
                if rec.AcceptWaveform(message):
                    result = json.loads(rec.Result())
                    # Log the full result from Vosk before sending
                    print(f"Vosk Final Result (full JSON): {json.dumps(result)}")
                    print(f"Final result recognized: {result['text']}")
                    await websocket.send(json.dumps({"type": "final", "text": result['text']}))
                else:
                    partial_result = json.loads(rec.PartialResult())
                    # Log the full partial result from Vosk before sending
                    # This will be very verbose, uncomment if truly needed
                    # print(f"Vosk Partial Result (full JSON): {json.dumps(partial_result)}")
                    if partial_result['partial']: # Only print if there's actual text
                        print(f"Partial result recognized: {partial_result['partial']}")
                    await websocket.send(json.dumps({"type": "partial", "text": partial_result['partial']}))
            else:
                print(f"Received non-binary data (expected audio): {message}. Type: {type(message)}")
                await websocket.send(json.dumps({"type": "error", "message": "Expected binary audio data."}))

    except websockets.exceptions.ConnectionClosedOK:
        print("WebSocket connection closed normally by client.")
    except websockets.exceptions.ConnectionClosed:
        print("WebSocket connection closed unexpectedly.")
    except Exception as e:
        print(f"An error occurred during recognition: {e}", file=sys.stderr)
        # Send an error message back to the client before closing
        try:
            await websocket.send(json.dumps({"type": "error", "message": str(e)}))
        except:
            pass # Ignore errors if websocket is already closing
    finally:
        # Ensure any pending final result is sent on connection close
        final_result = json.loads(rec.FinalResult())
        if final_result['text'].strip():
            print(f"Sending final result on close: {final_result['text']}")
            try:
                await websocket.send(json.dumps({"type": "final", "text": final_result['text']}))
            except Exception as e:
                print(f"Error sending final result on close: {e}", file=sys.stderr)
        print("Recognition stopped for this connection.")


async def main():
    # Start the WebSocket server
    # Listen on all available network interfaces (0.0.0.0) on port 8000
    server = await websockets.serve(recognize_audio, "0.0.0.0", 8000)
    print("Vosk WebSocket server started on ws://0.0.0.0:8000")
    await server.wait_closed()

if __name__ == "__main__":
    # Ensure the model path exists before starting the server
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Vosk model not found at {MODEL_PATH}. Please ensure it's copied into the container.")
        sys.exit(1)

    asyncio.run(main())