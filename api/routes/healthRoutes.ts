import express from 'express';
import { db } from '../config/firebase';

const router = express.Router();

const PORT = process.env.PORT || 10000;
const allowedOrigins = [
  'https://frontend-real-time.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://realtime-frontend.vercel.app'
];

router.get('/', (req, res) => {
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

router.get('/debug', (req, res) => {
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

router.get('/peerjs/health', (req, res) => {
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

export default router;