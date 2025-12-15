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

/**
 * Socket.IO server instance.
 *
 * Configured to support WebSocket and polling transports,
 * with CORS enabled using the defined `corsOptions`.
 *
 * @constant
 * @type {SocketIOServer}
 */
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

/**
 * Peer.js server options.
 *
 * Required configuration for Render deployment:
 * - `path: '/'` ensures PeerJS runs at the root.
 * - `debug: true` enables verbose logging.
 * - `proxied: true` ensures compatibility with reverse proxies.
 *
 * @constant
 * @type {object}
 */
const peerOptions: any = {
  path: '/',
  debug: true,
  proxied: true
};

console.log('🔧 [PEER] Configurando Peer.js con opciones:', peerOptions);


/**
 * Peer.js server instance.
 *
 * Handles peer-to-peer connections for WebRTC communication.
 *
 * @constant
 * @type {ExpressPeerServer}
 */
const peerServer = ExpressPeerServer(server, peerOptions);

/**
 * Root route to prevent Peer.js JSON from being displayed at `/`.
 *
 * @route GET /
 * @returns {string} Confirmation message that the voice server is running.
 */
app.get('/', (req, res) => {
  res.send('Servidor de voz funcionando ✔');
});


/**
 * Event listener for new peer connections.
 *
 * @event connection
 * @param {any} client - Connected peer client.
 */
peerServer.on('connection', (client: any) => {
  console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});

/**
 * Event listener for peer disconnections.
 *
 * @event disconnect
 * @param {any} client - Disconnected peer client.
 */
peerServer.on('disconnect', (client: any) => {
  console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});


/**
 * Event listener for Peer.js errors.
 *
 * @event error
 * @param {Error} error - Error object.
 */
peerServer.on('error', (error: Error) => {
  console.error('💥 [PEER] Error:', error);
});

/**
 * Event listener for peer calls.
 *
 * @event call
 * @param {any} call - Call object containing origin and peer info.
 */
peerServer.on('call', (call: any) => {
  console.log(`📞 [PEER] Llamada iniciada entre ${call.origin} y ${call.peer}`);
});

/**
 * Mount Peer.js server at root with CORS middleware.
 *
 * @middleware
 */
app.use('/', corsMiddleware, peerServer);

/**
 * Health check and debug routes.
 *
 * Mounted under `/api`.
 *
 * @see healthRoutes
 */
app.use(express.json());
app.use('/api', healthRoutes);

/**
 * Global error handler middleware.
 *
 * Logs unhandled errors and responds with a JSON error message.
 *
 * @function
 * @param {any} err - Error object.
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @param {express.NextFunction} next - Express next middleware function.
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [ERROR] Error no manejado en voz:', err.message);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

/**
 * Initializes custom voice service logic.
 *
 * @function initializeVoice
 * @param {SocketIOServer} io - Socket.IO server instance.
 * @param {ExpressPeerServer} peerServer - Peer.js server instance.
 */
initializeVoice(io, peerServer);

/**
 * Starts the HTTP server and logs startup information.
 *
 * @function
 */
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
