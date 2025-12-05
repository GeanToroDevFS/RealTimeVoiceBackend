/**
 * Main server entrypoint for the RealTime voice backend.
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

// Configuración de Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// IMPORTANTE: Configuración CORRECTA de Peer.js
const peerOptions = {
  path: '/peerjs',
  debug: process.env.NODE_ENV === 'development' ? 3 : 1,
  proxied: true, // CRÍTICO para Render
  // NO configurar host, port, o ssl - dejar que ExpressPeerServer lo maneje
};

const peerServer = ExpressPeerServer(server, peerOptions);

// Logs de Peer.js
peerServer.on('connection', (client: any) => {
  console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client: any) => {
  console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});

// Montar Peer.js en la ruta correcta
app.use('/peerjs', peerServer);

const PORT = process.env.PORT || 3002;

// Middleware CORS
app.use(cors({
  origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RealTime Voice Backend',
    version: '1.0.0',
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    peerJsPath: '/peerjs',
    socketIo: '✅ Inicializado',
  });
});

// Ruta específica para el endpoint que Peer.js está buscando
app.get('/peerjs/id', (req, res) => {
  console.log('📡 [PEER] ID endpoint accedido');
  res.json({
    message: 'Peer.js ID endpoint',
    timestamp: new Date().toISOString(),
  });
});

// Inicializar servicio de voz
initializeVoice(io, peerServer);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🌐 [STARTUP] Servidor de voz iniciado en puerto ${PORT}`);
  console.log(`🔗 Peer.js disponible en: http://localhost:${PORT}/peerjs`);
});