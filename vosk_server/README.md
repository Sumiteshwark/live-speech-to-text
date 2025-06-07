Vosk Live Speech-to-Text WebSocket Server
This repository contains the backend Python application for a live speech-to-text service using Vosk. It is designed to run as a WebSocket server, primarily on an AWS EC2 instance using Docker, and expects incoming audio streams from a client application (e.g., a React frontend).

🚀 Features
Real-time Transcription: Processes audio streams in real-time.

Vosk Integration: Utilizes the Vosk open-source speech recognition toolkit.

WebSocket Interface: Communicates with clients via a WebSocket for efficient, continuous audio streaming and transcription updates.

Dockerized Deployment: Packaged as a Docker image for easy, consistent, and portable deployment on cloud instances like AWS EC2.

Open Source Model: Uses Vosk's pre-trained, open-source language models.

📋 Prerequisites
Local Development (for testing / building Docker image)
Python 3.9+

pip (Python package installer)

Docker Desktop (or Docker Engine on Linux)

wget or curl (for downloading Vosk model)

unzip (for extracting Vosk model)

AWS EC2 Instance
An AWS account

An EC2 Ubuntu instance (e.g., 22.04 LTS)

SSH access to your EC2 instance with your .pem key

Sufficient EC2 instance type (e.g., t3.medium or c5.large depending on model size and load)

Security Group configured to allow SSH (port 22) and custom TCP (port 8000) inbound traffic.

🛠️ Setup Guide
This guide assumes you are starting with a fresh EC2 Ubuntu instance and connecting via SSH.

1. Connect to Your EC2 Instance
First, SSH into your EC2 Ubuntu instance using your .pem key:

chmod 400 /path/to/your-key-pair.pem # Set correct permissions for your key
ssh -i "/path/to/your-key-pair.pem" ubuntu@<YOUR_EC2_PUBLIC_IP_OR_DNS>

Replace /path/to/your-key-pair.pem with the actual path to your key and <YOUR_EC2_PUBLIC_IP_OR_DNS> with your instance's public IP address or DNS name.

2. Install Docker on EC2
Update your package list and install Docker:

sudo apt update
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu # Add your user to the docker group
newgrp docker # Apply the group change (or re-login to SSH session)
docker --version # Verify Docker is installed and running

3. Prepare Application Files on EC2
Create a directory for your application and navigate into it:

mkdir vosk-stt-docker
cd vosk-stt-docker

Create the following files in this directory:
=> app.py
=> requirements.txt
=> Dockerfile


# Example: Download the small English model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip

# Install unzip if you don't have it
sudo apt install unzip -y

# Unzip the model
unzip vosk-model-small-en-us-0.15.zip

# Rename the unzipped folder to 'model' (crucial for Dockerfile path)
mv vosk-model-small-en-us-0.15 model

Important: Ensure the unzipped model directory is named model and is in the same directory as your Dockerfile.

4. Build and Run the Docker Container
Make sure you are in the vosk-stt-docker directory on your EC2 instance.

Build the Docker Image:
docker build -t vosk-stt-app .

Stop and Remove Old Container (if any):
docker stop vosk-live-stt || true # Stop if running, ignore error if not
docker rm vosk-live-stt || true  # Remove if exists, ignore error if not

Run the New Container:
docker run -d -p 8000:8000 --name vosk-live-stt vosk-stt-app

🔌 Usage: Connecting from a Client
Your Vosk WebSocket server is now running on your EC2 instance, listening on port 8000. You can connect to it from your local React (or Express proxy) application.

WebSocket URL: ws://YOUR_EC2_PUBLIC_IP:8000

Replace YOUR_EC2_PUBLIC_IP with the actual Public IPv4 address or Public IPv4 DNS of your EC2 instance.
