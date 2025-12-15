# RealTime Voice Backend

Este es el backend para la funcionalidad de voz en tiempo real de la plataforma RealTime, manejando transmisiones de audio vía WebRTC usando Peer.js y Socket.IO para señalización y gestión de salas. Los metadatos de reuniones se validan y almacenan en Firestore. Está construido con Node.js, TypeScript y Express.

## Características
- **Transmisión de Voz en Tiempo Real**: Los usuarios pueden unirse a salas de reuniones y transmitir/recibir audio en tiempo real vía Peer.js y WebRTC.
- **Gestión de Reuniones**: Validación de reuniones activas en Firestore; soporte para 2-10 usuarios por reunión.
- **Señalización WebRTC**: Manejo de ofertas, respuestas y candidatos ICE a través de Socket.IO.
- **Autenticación**: Rutas protegidas usando tokens JWT (para futuras expansiones).
- **Sin Persistencia de Audio**: El audio es efímero; solo metadatos de reuniones se guardan en Firestore.
- **Servidores ICE**: Proporciona servidores STUN para conexiones WebRTC.

## Tecnologías
- Node.js
- TypeScript
- Express
- Socket.IO
- Peer.js
- Firebase Admin SDK (Firestore para validación de reuniones)

## Configuración
1. Clona este repositorio.
2. Instala dependencias: `npm install`.
3. Copia `.env.example` a `.env` y completa las variables (comparte configuración de Firebase del backend de usuario).
4. Construye: `npm run build`.
5. Ejecuta: `npm start` (o `npm run dev` para desarrollo).

## Variables de Entorno
- `PORT`: Puerto del servidor (default: 10000)
- `JWT_SECRET`: Secreto JWT para autenticación
- `FIREBASE_PROJECT_ID`: ID del proyecto Firebase
- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON de cuenta de servicio Firebase
- `FRONTEND_URL`: URL del frontend para CORS (opcional, ya que se maneja en código)

## Endpoints de API
- `GET /api/health`: Health check básico del servidor.
- `GET /api/debug`: Información de debug (entorno, configuración).
- `GET /api/peerjs/health`: Health check específico de Peer.js.
- `GET /api/ice-servers`: Lista de servidores ICE para WebRTC.

## Eventos de Socket.IO
- `authenticate`: Autenticar socket con token.
- `join-voice-room`: Unirse a sala de voz de una reunión (valida existencia y límite de usuarios).
- `leave-voice-room`: Salir de la sala de voz.
- `end-meeting`: Finalizar reunión (fuerza desconexión).
- `webrtc-offer`: Enviar oferta WebRTC a otro peer.
- `webrtc-answer`: Enviar respuesta WebRTC a otro peer.
- `ice-candidate`: Enviar candidato ICE a otro peer.
- `media-state-change`: Notificar cambios en estado de audio/video.

## Despliegue
Despliega en Render. Asegura que las variables de entorno estén configuradas. Peer.js está configurado para funcionar en el path raíz (`/`) para compatibilidad con Render.

## Contribuyendo
Sigue el Git Workflow: Crea ramas, haz commits pequeños, envía PRs con tag sprint-X-release.
