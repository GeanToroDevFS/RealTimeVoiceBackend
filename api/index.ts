import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import cors from 'cors';
import { initializeVoice } from './services/voiceService';
import { corsOptions, corsMiddleware } from './middlewares/cors';
import healthRoutes from './routes/healthRoutes';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 10000;

app.use(cors(corsOptions));
app.use(corsMiddleware);

/* -------------------- SOCKET.IO -------------------- */
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

/* -------------------- PEER.JS (FIX PARA RENDER) -------------------- */
// ⚠️ EN RENDER: PeerJS debe vivir en `/` y no en subrutas
const peerOptions: any = {
  path: '/',
  debug: true,
  proxied: true
};

console.log('🔧 [PEER] Configurando Peer.js con opciones:', peerOptions);

const peerServer = ExpressPeerServer(server, peerOptions);

/* -------------------- EVENTOS PEER -------------------- */
peerServer.on('connection', (client: any) => {
  console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client: any) => {
  console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});

peerServer.on('error', (error: Error) => {
  console.error('💥 [PEER] Error:', error);
});

peerServer.on('call', (call: any) => {
  console.log(`📞 [PEER] Llamada iniciada entre ${call.origin} y ${call.peer}`);
});

/* -------------------- MONTAR PEER SERVER EN ROOT -------------------- */
// ⚠️ También montamos en `/`
app.use('/', corsMiddleware, peerServer);

/* -------------------- RUTAS API -------------------- */
app.use(express.json());
app.use('/api', healthRoutes);

/* -------------------- MANEJO GLOBAL DE ERRORES -------------------- */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [ERROR] Error no manejado en voz:', err.message);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

/* -------------------- INICIALIZAR LÓGICA DE VOZ -------------------- */
initializeVoice(io, peerServer);

/* -------------------- START SERVER -------------------- */
server.listen(PORT, () => {
  console.log(`🌐 [STARTUP] Servidor de voz corriendo en puerto ${PORT}`);
  console.log(`🔗 [STARTUP] Peer.js disponible en: https://realtimevoicebackend.onrender.com/`);
  console.log(`🚀 [STARTUP] Health check: https://realtimevoicebackend.onrender.com/api/health`);
  console.log(`🌍 [STARTUP] CORS habilitado para:`, [
    'https://frontend-real-time.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://realtime-frontend.vercel.app'
  ]);
});
