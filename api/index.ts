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

const PORT = process.env.PORT || 10000;

// Configuración de CORS COMPLETAMENTE PERMISIVA
const allowedOrigins = [
  'https://frontend-real-time.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://realtime-frontend.vercel.app'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Permitir requests sin origen
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.log('🚫 Origen bloqueado por CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Middleware CORS global
app.use(cors(corsOptions));

// Middleware manual para headers CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configuración de Socket.IO con CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Peer.js server for WebRTC - CONFIGURACIÓN CORREGIDA
const peerOptions: any = {
  path: '/peerjs',
  debug: true,
  proxied: true // CRÍTICO para Render
};

console.log('🔧 [PEER] Configurando Peer.js con opciones:', peerOptions);

const peerServer = ExpressPeerServer(server, peerOptions as any);

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

// Middleware para Peer.js con CORS
app.use('/peerjs', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, peerServer);

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  console.log('🚀 [HEALTH] Solicitud de health check en voz');
  res.header('Content-Type', 'text/plain');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.send('🚀 Backend de voz para RealTime funcionando correctamente.\n' +
    'Servicio: RealTime Voice Backend\n' +
    `Puerto: ${PORT}\n` +
    'Peer.js: Disponible\n' +
    'CORS: Habilitado\n' +
    `Timestamp: ${new Date().toISOString()}`);
});

// Debug endpoint
app.get('/debug', (req, res) => {
  console.log('🔍 [DEBUG] Solicitud de información de debug en voz');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.json({
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado',
    socketIo: '✅ Inicializado',
    peerJs: '✅ Inicializado',
    peerJsPath: '/peerjs',
    cors: {
      enabled: true,
      origins: allowedOrigins
    }
  });
});

// Endpoint para verificar conexión Peer.js
app.get('/peerjs/health', (req, res) => {
  console.log('📡 [PEER] Health check solicitado');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.json({
    status: 'running',
    endpoint: 'https://realtimevoicebackend.onrender.com/peerjs',
    webSocketEndpoint: 'wss://realtimevoicebackend.onrender.com/peerjs',
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [ERROR] Error no manejado en voz:', err.message);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
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
  console.log(`🌍 [STARTUP] CORS habilitado para:`, allowedOrigins);
});