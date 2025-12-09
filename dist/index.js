"use strict";
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
const cors_2 = require("./middlewares/cors");
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 10000;
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use(cors_2.corsMiddleware);
/* -------------------- SOCKET.IO -------------------- */
const io = new socket_io_1.Server(server, {
    cors: cors_2.corsOptions,
    transports: ['websocket', 'polling'],
    allowEIO3: true
});
/* -------------------- PEER.JS (FIX PARA RENDER) -------------------- */
// ⚠️ EN RENDER: PeerJS debe vivir en `/` y no en subrutas
const peerOptions = {
    path: '/',
    debug: true,
    proxied: true
};
console.log('🔧 [PEER] Configurando Peer.js con opciones:', peerOptions);
const peerServer = (0, peer_1.ExpressPeerServer)(server, peerOptions);
/* -------------------- EVENTOS PEER -------------------- */
peerServer.on('connection', (client) => {
    console.log(`🔗 [PEER] Cliente conectado: ${client.getId()}`);
});
peerServer.on('disconnect', (client) => {
    console.log(`🔌 [PEER] Cliente desconectado: ${client.getId()}`);
});
peerServer.on('error', (error) => {
    console.error('💥 [PEER] Error:', error);
});
peerServer.on('call', (call) => {
    console.log(`📞 [PEER] Llamada iniciada entre ${call.origin} y ${call.peer}`);
});
/* -------------------- MONTAR PEER SERVER EN ROOT -------------------- */
// ⚠️ También montamos en `/`
app.use('/', cors_2.corsMiddleware, peerServer);
/* -------------------- RUTAS API -------------------- */
app.use(express_1.default.json());
app.use('/api', healthRoutes_1.default);
/* -------------------- MANEJO GLOBAL DE ERRORES -------------------- */
app.use((err, req, res, next) => {
    console.error('💥 [ERROR] Error no manejado en voz:', err.message);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});
/* -------------------- INICIALIZAR LÓGICA DE VOZ -------------------- */
(0, voiceService_1.initializeVoice)(io, peerServer);
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
