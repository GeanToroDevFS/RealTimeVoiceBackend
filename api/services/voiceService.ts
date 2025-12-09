/**
 * Voice service using Socket.IO and Peer.js for real-time voice transmission in meetings.
 *
 * This service handles Peer.js connections for WebRTC voice calls, integrated with Socket.IO
 * for signaling and room management. It validates meetings via Firestore and manages peer connections.
 * Supports 2-10 users per meeting with real-time audio.
 */

import { Server as SocketIOServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import { db } from '../config/firebase';

/**
 * Map to track active peer connections per meeting.
 * Key: meetingId, Value: Set of peer IDs in the meeting.
 */
const activePeers = new Map<string, Set<string>>();

/**
 * Initialize voice service with Socket.IO and Peer.js.
 *
 * @param {SocketIOServer} io - The Socket.IO server instance.
 * @param {any} peerServer - The Peer.js server instance.
 */
export const initializeVoice = (io: SocketIOServer, peerServer: any) => {
  // Peer.js server events
  peerServer.on('connection', (client: any) => {
    console.log(`🔗 [VOICE] Peer connected: ${client.id}`);
  });

  peerServer.on('disconnect', (client: any) => {
    console.log(`🔌 [VOICE] Peer disconnected: ${client.id}`);
    // Remove from all meetings
    for (const [meetingId, peers] of activePeers) {
      if (peers.has(client.id)) {
        peers.delete(client.id);
        io.to(meetingId).emit('peer-disconnected', client.id);
        console.log(`🚪 [VOICE] Peer ${client.id} removed from meeting ${meetingId}`);
      }
    }
  });

  // Socket.IO events for voice signaling
  io.on('connection', (socket) => {
    console.log(`🔗 [VOICE] Socket connected: ${socket.id}`);

    // Autenticación del socket
    socket.on('authenticate', (data: { token: string }) => {
      // Aquí puedes validar el token JWT si es necesario
      console.log(`🔐 [VOICE] Socket ${socket.id} autenticado`);
    });

    socket.on('join-voice-room', async (data: { meetingId: string; peerId: string; userId: string }) => {
      const { meetingId, peerId, userId } = data;
      console.log(`🔹 [VOICE] User ${socket.id} (${userId}) joining voice in meeting: ${meetingId}`);

      try {
        // Validate meeting exists and is active
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists || meetingDoc.data()?.status !== 'active') {
          socket.emit('voice-error', 'Meeting not found or inactive');
          return;
        }

        // Limit to 10 users
        if (!activePeers.has(meetingId)) activePeers.set(meetingId, new Set());
        const peers = activePeers.get(meetingId)!;
        if (peers.size >= 10) {
          socket.emit('voice-error', 'Meeting full (maximum 10 users)');
          return;
        }

        socket.join(meetingId);
        peers.add(peerId);
        console.log(`✅ [VOICE] Peer ${peerId} joined voice room: ${meetingId}`);

        // Notify others in the room to connect via Peer.js
        socket.to(meetingId).emit('peer-joined', peerId);
        // Send existing peers to the new user for connection
        socket.emit('voice-joined', {
          peers: Array.from(peers).filter(p => p !== peerId),
          meetingId
        });
      } catch (error) {
        console.error('❌ [VOICE] Error joining voice room:', error);
        socket.emit('voice-error', 'Internal server error');
      }
    });

    socket.on('leave-voice-room', (data: { meetingId: string; peerId: string }) => {
      const { meetingId, peerId } = data;
      console.log(`🚪 [VOICE] User ${peerId} leaving voice in meeting: ${meetingId}`);
      
      socket.leave(meetingId);
      const peers = activePeers.get(meetingId);
      if (peers) {
        peers.delete(peerId);
        io.to(meetingId).emit('peer-disconnected', peerId);
        
        // Si no hay más peers, limpiar la reunión
        if (peers.size === 0) {
          activePeers.delete(meetingId);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [VOICE] Socket disconnected: ${socket.id}, reason: ${reason}`);
      // Cleanup peers on disconnect
      for (const [meetingId, peers] of activePeers) {
        if (peers.has(socket.id)) {
          peers.delete(socket.id);
          io.to(meetingId).emit('peer-disconnected', socket.id);
          
          // Si no hay más peers, limpiar la reunión
          if (peers.size === 0) {
            activePeers.delete(meetingId);
          }
        }
      }
    });

    socket.on('error', (error) => {
      console.error(`💥 [VOICE] Socket error for ${socket.id}:`, error);
    });
  });
};