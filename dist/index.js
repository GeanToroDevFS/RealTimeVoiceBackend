"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const peer_1 = require("peer");
const cors_1 = __importDefault(require("cors"));
const voiceService_1 = require("./services/voiceService");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'https://frontend-real-time.vercel.app',
        methods: ['GET', 'POST'],
    },
});
// Peer.js server for WebRTC (acts as STUN/TURN server)
const peerServer = (0, peer_1.ExpressPeerServer)(server, {
    path: '/peerjs',
});
app.use('/peerjs', peerServer);
const PORT = process.env.PORT || 3002;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'https://frontend-real-time.vercel.app',
    credentials: true,
}));
app.use(express_1.default.json());
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
app.use((err, req, res, next) => {
    console.error('💥 [ERROR] Error no manejado en voz:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});
// Initialize voice service
(0, voiceService_1.initializeVoice)(io, peerServer);
// Start server
server.listen(PORT, () => {
    console.log(`🌐 [STARTUP] Servidor de voz corriendo en puerto ${PORT}`);
    console.log(`🔍 [STARTUP] Debug disponible en: http://localhost:${PORT}/debug`);
});
