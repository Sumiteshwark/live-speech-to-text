# 🗣️ Vosk Live Speech-to-Text WebSocket Server (Local Docker + venv Version)

This repository contains a Python-based WebSocket server for live speech-to-text transcription using [Vosk](https://alphacephei.com/vosk/). It processes audio streams in real-time from a client (like a React app) and returns transcribed text using a Vosk model.

---

## 🚀 Features

* **Real-time Transcription**: Stream audio and get live transcriptions.
* **WebSocket Interface**: Designed for low-latency bi-directional communication.
* **Vosk Integration**: Powered by open-source Vosk speech recognition.
* **Dockerized**: Easily run locally using Docker.
* **Offline**: Uses pre-trained local models (no API keys needed).
* **Local Virtual Environment Option**: Run natively without Docker using Python virtual environment.

---

## 📋 Prerequisites

### Local Development (macOS, Linux, Windows)

* Python 3.9+
* `pip` (Python package installer)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(Optional)*
* `wget` or `curl`
* `unzip`

---

## 🛠️ Setup Guide (Local)

### 1. Clone the Repository

```bash
git clone https://github.com/Sumiteshwark/live-speech-to-text.git
cd live-speech-to-text
```

### 2. Download and Prepare the Vosk Model (Already Done in Repo)

```bash
# Download the small English model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip

# If unzip isn't installed, install it
# macOS (via Homebrew)
brew install unzip

# Unzip the model
unzip vosk-model-small-en-us-0.15.zip

# Rename to 'model' (Docker and local app expect this directory)
mv vosk-model-small-en-us-0.15 model
```

> 📁 Make sure the `model` directory is at the root of the project and contains the model files.

---

## 🐳 Run with Docker (Optional)

```bash
# Build the Docker image
docker build -t vosk-stt-app .

# Stop and remove any old containers (optional)
docker stop vosk-live-stt || true
docker rm vosk-live-stt || true

# Run the container
docker run -d -p 8000:8000 --name vosk-live-stt vosk-stt-app
```

---

## 🐍 Run Locally with Python Virtual Environment

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

The WebSocket server will start and listen on:

```
ws://localhost:8000
```

---

## 🔌 Usage: Connect from Client

Your WebSocket server is now available at:

```
ws://localhost:8000
```

Connect to this from a frontend application (e.g., React) using WebSocket APIs to stream audio and receive transcription data.

---

## 🪄 Stop the Docker Container

```bash
docker stop vosk-live-stt
docker rm vosk-live-stt
```

---

## 🧪 Testing Locally

You can use tools like [websocat](https://github.com/vi/websocat) or write a simple WebSocket client in JavaScript or Python to test the endpoint.

---

## 📜 License

This project uses open-source components and is distributed under the MIT license.
