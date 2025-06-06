# Speech to Text Client

This is the client-side application for the Speech to Text project, built with React.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

- `/src` - Source code
- `/public` - Static assets
- `/dist` - Production build output

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
VITE_API_URL=http://localhost:5000
```

## Features

- Real-time speech to text conversion
- Modern and responsive UI
- WebSocket integration for live transcription
