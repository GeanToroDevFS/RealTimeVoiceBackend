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

// IMPORTANTE: Render asigna un puerto dinámico, no usar 443
const PORT = process.env.PORT || 10000;

// Configuración de CORS para desarrollo y producción
const corsOptions = {
  origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware CORS
app.use(cors(corsOptions));

// Configuración de Socket.IO
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Peer.js server for WebRTC - Configuración para Render
const peerOptions = {
  path: '/peerjs',
  debug: true,
  proxied: true, // CRÍTICO para Render
  // NO especificar puerto, let Render handle it
};

console.log('🔧 [PEER] Configurando Peer.js con opciones:', peerOptions);

const peerServer = ExpressPeerServer(server, peerOptions);

// Eventos de Peer.js para debugging
peerServer.on('connection', (client: any) => {
  console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client: any) => {
  console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});

peerServer.on('error', (error: Error) => {
  console.error('💥 [PEER] Error:', error);
});

app.use('/peerjs', peerServer);

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  console.log('🚀 [HEALTH] Solicitud de health check en voz');
  res.json({
    status: 'healthy',
    service: 'RealTime Voice Backend',
    port: PORT,
    peerjs: 'available',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  console.log('🔍 [DEBUG] Solicitud de información de debug en voz');
  res.json({
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado',
    socketIo: '✅ Inicializado',
    peerJs: '✅ Inicializado',
    peerJsPath: '/peerjs',
    cors: corsOptions.origin
  });
});

// Endpoint para verificar conexión Peer.js
app.get('/peerjs/health', (req, res) => {
  console.log('📡 [PEER] Health check solicitado');
  res.json({
    status: 'running',
    endpoint: 'https://realtimevoicebackend.onrender.com/peerjs',
    webSocketEndpoint: 'wss://realtimevoicebackend.onrender.com/peerjs',
    timestamp: new Date().toISOString()
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
  console.log(`🔗 [STARTUP] Peer.js disponible en: https://realtimevoicebackend.onrender.com/peerjs`);
  console.log(`🔍 [STARTUP] Debug disponible en: https://realtimevoicebackend.onrender.com/debug`);
  console.log(`🚀 [STARTUP] Health check: https://realtimevoicebackend.onrender.com/`);
  console.log(`📡 [STARTUP] Peer.js health: https://realtimevoicebackend.onrender.com/peerjs/health`);
});