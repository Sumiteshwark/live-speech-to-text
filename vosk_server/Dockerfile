# Use an official Python runtime as a parent image
# python:3.9-slim-buster is a good lightweight choice based on Debian
FROM python:3.9-slim-buster

# Set the working directory inside the container
# All subsequent COPY and RUN commands will be relative to this directory
WORKDIR /app

# Install system-level dependencies required by Vosk and its underlying Kaldi engine.
# - ffmpeg: Often needed for audio processing/decoding, though not directly used for raw PCM in app.py.
# - libatomic1: A common dependency for Vosk's native libraries on Linux.
# --no-install-recommends: Reduces the size of the final image by not installing recommended packages.
# rm -rf /var/lib/apt/lists/*: Cleans up apt caches to keep the image size small.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the Python dependencies file into the container
# This is done before copying app.py to leverage Docker's build cache.
COPY requirements.txt .

# Install the Python dependencies listed in requirements.txt
# --no-cache-dir: Prevents pip from storing cache files, further reducing image size.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the main application script
COPY app.py .

# Copy the Vosk model directory into the container
# IMPORTANT: Ensure your unzipped Vosk model folder is named 'model'
# and is in the same directory as this Dockerfile.
COPY model ./model

# Expose the port on which your Python WebSocket server will listen.
# This informs Docker that the container listens on this port.
# You still need to map this port when running the container (e.g., -p 8000:8000).
EXPOSE 8000

# Define the command to run your application when the container starts.
# This will execute your app.py script.
CMD ["python", "app.py"]
