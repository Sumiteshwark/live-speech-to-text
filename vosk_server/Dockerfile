# DOCKERFILE FOR WINDOWS AND LINUX
FROM python:3.9-slim-buster

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

COPY model ./model

EXPOSE 8000

CMD ["python", "app.py"]



# # DOCKERFILE FOR MAC 
# # Use an Ubuntu 20.04 base image
# FROM ubuntu:20.04

# # Set the working directory inside the container
# WORKDIR /app

# # Prevent interactive prompts during apt installs
# ENV DEBIAN_FRONTEND=noninteractive

# # Update package lists and install Python 3.9, pip, and other necessary system dependencies
# # - python3.9 and python3-pip: To get Python and its package installer
# # - ffmpeg: Often needed for audio processing/decoding, a common Vosk dependency.
# # - libatomic1: A crucial dependency for Vosk's native libraries on Linux.
# # - build-essential: Includes compilers and development tools, sometimes needed for pip packages, though Vosk is pre-compiled.
# # - python3.9-dev: Development headers for Python, needed for some pip packages with C extensions.
# # rm -rf /var/lib/apt/lists/*: Cleans up apt caches to keep the image size small.
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends \
#     python3.9 \
#     python3-pip \
#     ffmpeg \
#     libatomic1 \
#     build-essential \
#     python3.9-dev \
#     && rm -rf /var/lib/apt/lists/*

# # Set python3.9 as the default python3
# RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1

# # Copy the Python dependencies file into the container
# COPY requirements.txt .

# # Install the Python dependencies listed in requirements.txt
# # --no-cache-dir: Prevents pip from storing cache files, reducing image size.
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy the main application script
# COPY app.py .

# # Copy the Vosk model directory into the container
# # IMPORTANT: Ensure your unzipped Vosk model folder is named 'model'
# # and is in the same directory as this Dockerfile.
# COPY model ./model

# # Expose the port on which your Python WebSocket server will listen.
# EXPOSE 8000

# # Define the command to run your application when the container starts.
# # Ensure there are NO extra characters (like hidden spaces or commas)
# # inside the square brackets beyond the literal strings.
# CMD ["python3", "app.py"]
