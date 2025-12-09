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
const io = new socket_io_1.Server(server, {
    cors: cors_2.corsOptions,
    transports: ['websocket', 'polling'],
    allowEIO3: true
});
const peerOptions = {
    path: '/peerjs',
    debug: true,
    proxied: true
};
console.log('🔧 [PEER] Configurando Peer.js con opciones:', peerOptions);
const peerServer = (0, peer_1.ExpressPeerServer)(server, peerOptions);
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
app.use('/peerjs', cors_2.corsMiddleware, peerServer);
app.use(express_1.default.json());
app.use('/', healthRoutes_1.default);
app.use((err, req, res, next) => {
    console.error('💥 [ERROR] Error no manejado en voz:', err.message);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});
(0, voiceService_1.initializeVoice)(io, peerServer);
server.listen(PORT, () => {
    console.log(`🌐 [STARTUP] Servidor de voz corriendo en puerto ${PORT}`);
    console.log(`🔗 [STARTUP] Peer.js disponible en: https://realtimevoicebackend.onrender.com/peerjs`);
    console.log(`🔍 [STARTUP] Debug disponible en: https://realtimevoicebackend.onrender.com/debug`);
    console.log(`🚀 [STARTUP] Health check: https://realtimevoicebackend.onrender.com/`);
    console.log(`📡 [STARTUP] Peer.js health: https://realtimevoicebackend.onrender.com/peerjs/health`);
    console.log(`🌍 [STARTUP] CORS habilitado para:`, [
        'https://frontend-real-time.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'https://realtime-frontend.vercel.app'
    ]);
});
