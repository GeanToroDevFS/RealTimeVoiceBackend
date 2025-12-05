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

// Configuración mejorada de Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Soporte para ambos
  pingTimeout: 60000, // 60 segundos
  pingInterval: 25000, // 25 segundos
});

// Configuración CORRECTA de Peer.js para producción en Render
const peerOptions = {
  path: '/peerjs',
  debug: process.env.NODE_ENV === 'development' ? 3 : 1,
  proxied: true, // IMPORTANTE para Render/Vercel
  // SSL se maneja automáticamente en Render, no necesitamos configurarlo aquí
  allow_discovery: true,
  concurrent_limit: 5000,
  key: 'peerjs',
  ip_limit: 5000,
  // Configuración adicional para WebRTC
  alive_timeout: 60000, // 60 segundos
  secure: process.env.NODE_ENV === 'production', // Esto sí es booleano
};

const peerServer = ExpressPeerServer(server, peerOptions);

// Logs de eventos de Peer.js
peerServer.on('connection', (client: any) => {
  console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client: any) => {
  console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});

peerServer.on('error', (error: Error) => {
  console.error('💥 [PEER] Error en servidor Peer.js:', error);
});

app.use('/peerjs', peerServer);

const PORT = process.env.PORT || 3002;

// Middleware CORS mejorado
app.use(cors({
  origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Middleware para preflight requests
app.options('*', cors());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📥 [HTTP] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check mejorado
app.get('/', (req, res) => {
  console.log('🚀 [HEALTH] Health check solicitado');
  res.json({
    status: 'healthy',
    service: 'RealTime Voice Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Debug endpoint mejorado
app.get('/debug', (req, res) => {
  console.log('🔍 [DEBUG] Debug info solicitada');
  
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
  };
  
  res.json({
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ No configurado',
    port: PORT,
    socketIo: '✅ Inicializado',
    peerJs: '✅ Inicializado',
    memory: memoryUsageMB,
    uptime: Math.round(process.uptime()),
  });
});

// Endpoint para verificar conexión de Peer.js
app.get('/peerjs/status', (req, res) => {
  console.log('📡 [PEER] Status check solicitado');
  
  // Información básica del servidor Peer.js
  res.json({
    status: 'running',
    path: '/peerjs',
    timestamp: new Date().toISOString(),
    serverTime: Date.now(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Endpoint para información del servidor WebRTC
app.get('/webrtc/info', (req, res) => {
  console.log('🌐 [WEBRTC] Info solicitada');
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    supports: ['WebRTC', 'Peer-to-Peer', 'Socket.IO'],
    maxParticipants: 10,
    requiresAuthentication: true,
  });
});

// Ruta para verificar estado del meeting
app.get('/meetings/:meetingId/status', async (req, res) => {
  const { meetingId } = req.params;
  console.log(`📋 [MEETING] Status check para: ${meetingId}`);
  
  try {
    const { db } = await import('./config/firebase');
    const meetingDoc = await db.collection('meetings').doc(meetingId).get();
    
    if (!meetingDoc.exists) {
      return res.status(404).json({ error: 'Meeting no encontrado' });
    }
    
    const meetingData = meetingDoc.data();
    res.json({
      meetingId,
      status: meetingData?.status || 'unknown',
      creatorId: meetingData?.creatorId,
      createdAt: meetingData?.createdAt,
      participantCount: meetingData?.participants?.length || 0,
    });
  } catch (error) {
    console.error('💥 [MEETING] Error obteniendo status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Test endpoint para verificar que todo funciona
app.get('/test', (req, res) => {
  res.json({
    message: 'Backend de voz funcionando',
    endpoints: [
      { path: '/', method: 'GET', description: 'Health check' },
      { path: '/debug', method: 'GET', description: 'Debug information' },
      { path: '/peerjs/status', method: 'GET', description: 'Peer.js status' },
      { path: '/webrtc/info', method: 'GET', description: 'WebRTC server info' },
      { path: '/meetings/:id/status', method: 'GET', description: 'Meeting status' },
    ]
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  console.log(`⚠️ [404] Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      { path: '/', method: 'GET', description: 'Health check' },
      { path: '/debug', method: 'GET', description: 'Debug information' },
      { path: '/peerjs/status', method: 'GET', description: 'Peer.js status' },
      { path: '/webrtc/info', method: 'GET', description: 'WebRTC server info' },
      { path: '/meetings/:meetingId/status', method: 'GET', description: 'Meeting status' },
      { path: '/test', method: 'GET', description: 'Test endpoint' },
    ],
  });
});

// Error handling global mejorado
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [ERROR] Error no manejado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Inicializar servicio de voz
initializeVoice(io, peerServer);

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 [SHUTDOWN] SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ [SHUTDOWN] Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 [SHUTDOWN] SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ [SHUTDOWN] Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 [FATAL] Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [FATAL] Promesa rechazada no manejada:', reason);
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🌐 [STARTUP] Servidor de voz iniciado correctamente`);
  console.log(`   📍 Puerto: ${PORT}`);
  console.log(`   🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🔗 Peer.js: http://localhost:${PORT}/peerjs`);
  console.log(`   🔍 Debug: http://localhost:${PORT}/debug`);
  console.log(`   📡 WebRTC Info: http://localhost:${PORT}/webrtc/info`);
  console.log(`   🚀 Health: http://localhost:${PORT}/`);
  console.log(`   🧪 Test: http://localhost:${PORT}/test`);
});

// Exportar para testing si es necesario
export { app, server, io, peerServer };