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

/**
 * Root health check endpoint.
 *
 * Responds with plain text confirming that the RealTime Voice Backend
 * is running correctly. Includes service details such as port, Peer.js
 * availability, CORS status, and a timestamp.
 *
 * @route GET /
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void} Sends a plain text health check response.
 *
 * @example
 * // Request
 * GET /
 *
 * // Response
 * 🚀 Backend de voz para RealTime funcionando correctamente.
 * Servicio: RealTime Voice Backend
 * Puerto: 10000
 * Peer.js: Disponible
 * CORS: Habilitado
 * Timestamp: 2025-12-14T22:11:00.000Z
 */
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

/**
 * Debug information endpoint.
 *
 * Provides JSON output with environment details, port configuration,
 * Firebase project status, Socket.IO and Peer.js initialization, and
 * CORS settings.
 *
 * @route GET /debug
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void} Sends a JSON object with debug information.
 *
 * @example
 * // Request
 * GET /debug
 *
 * // Response
 * {
 *   "environment": "development",
 *   "port": 10000,
 *   "firebaseProjectId": "✅ Configured",
 *   "socketIo": "✅ Initialized",
 *   "peerJs": "✅ Initialized",
 *   "peerJsPath": "/peerjs",
 *   "cors": {
 *     "enabled": true,
 *     "origins": [...]
 *   }
 * }
 */
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

/**
 * Peer.js health check endpoint.
 *
 * Confirms that the Peer.js server is running and provides
 * both HTTP and WebSocket endpoints, along with CORS status
 * and a timestamp.
 *
 * @route GET /peerjs/health
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void} Sends a JSON object with Peer.js health status.
 *
 * @example
 * // Request
 * GET /peerjs/health
 *
 * // Response
 * {
 *   "status": "running",
 *   "endpoint": "https://realtimevoicebackend.onrender.com/peerjs",
 *   "webSocketEndpoint": "wss://realtimevoicebackend.onrender.com/peerjs",
 *   "cors": "enabled",
 *   "timestamp": "2025-12-14T22:11:00.000Z"
 * }
 */
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

/**
 * ICE servers endpoint.
 *
 * Provides a list of STUN servers used for WebRTC connections.
 * This helps clients establish peer-to-peer communication.
 *
 * @route GET /ice-servers
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void} Sends a JSON object containing ICE server configuration.
 *
 * @example
 * // Request
 * GET /ice-servers
 *
 * // Response
 * {
 *   "iceServers": [
 *     { "urls": "stun:stun.l.google.com:19302" },
 *     { "urls": "stun:stun1.l.google.com:19302" }
 *   ]
 * }
 */
router.get('/ice-servers', (req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });
});

export default router;