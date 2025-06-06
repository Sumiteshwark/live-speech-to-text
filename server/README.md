# Speech to Text Server

This is the server-side application for the Speech to Text project, built with Node.js and Express.

## Prerequisites

- Node.js (v14 or higher)
- npm

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and edit the `.env` file with your configuration.

3. Start the server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Build for production

## Features

- Real-time speech to text conversion
- WebSocket support for live transcription
- RESTful API endpoints
- Error handling and logging