"use strict";
/**
 * Main server entrypoint for the RealTime voice backend.
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
// Configuración de Socket.IO
const io = new socket_io_1.Server(server, {
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
const peerServer = (0, peer_1.ExpressPeerServer)(server, peerOptions);
// Logs de Peer.js
peerServer.on('connection', (client) => {
    console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});
peerServer.on('disconnect', (client) => {
    console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});
// Montar Peer.js en la ruta correcta
app.use('/peerjs', peerServer);
const PORT = process.env.PORT || 3002;
// Middleware CORS
app.use((0, cors_1.default)({
    origin: ['https://frontend-real-time.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
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
(0, voiceService_1.initializeVoice)(io, peerServer);
// Iniciar servidor
server.listen(PORT, () => {
    console.log(`🌐 [STARTUP] Servidor de voz iniciado en puerto ${PORT}`);
    console.log(`🔗 Peer.js disponible en: http://localhost:${PORT}/peerjs`);
});
