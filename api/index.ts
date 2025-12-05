/**
 * Main server entrypoint for the RealTime voice backend.
 *
 * This module:
 *  - Loads environment variables via dotenv.
 *  - Creates and configures an Express application with Socket.IO and Peer.js.
 *  - Applies global middleware (CORS).
 *  - Initializes voice service with Peer.js for WebRTC.
 *  - Exposes simple health and debug endpoints.
 *  - Starts the HTTP server on the configured PORT.
 *
 * Environment variables used:
 *  - PORT (optional): Port to listen on (defaults to 3002)
 *  - NODE_ENV: Environment name used in /debug response
 *  - FIREBASE_PROJECT_ID: Presence reported in /debug
 *  - FRONTEND_URL: Used by CORS
 *  - JWT_SECRET: For auth (if needed)
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import cors from 'cors';
import { initializeVoice } from './services/voiceService';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Peer.js server for WebRTC (acts as STUN/TURN server)
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
});

app.use('/peerjs', peerServer);

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000'],  // Agrega localhost para desarrollo
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  console.log('🚀 [HEALTH] Solicitud de health check en voz');
  res.send('🚀 Backend de voz para RealTime funcionando correctamente.');
});

// Debug endpoint
app.get('/debug', (req, res) => {
  console.log('🔍 [DEBUG] Solicitud de información de debug en voz');
  res.json({
    environment: process.env.NODE_ENV,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado',
    port: PORT,
    socketIo: '✅ Inicializado',
    peerJs: '✅ Inicializado',
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [ERROR] Error no manejado en voz:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Initialize voice service
initializeVoice(io, peerServer);

// Start server
server.listen(PORT, () => {
  console.log(`🌐 [STARTUP] Servidor de voz corriendo en puerto ${PORT}`);
  console.log(`🔍 [STARTUP] Debug disponible en: http://localhost:${PORT}/debug`);
});