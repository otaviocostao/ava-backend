import {
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserInfo {
  userId: string;
  userName?: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class LiveClassGateway {
  @WebSocketServer()
  server: Server;

  private socketToRoom = new Map<string, string>();
  private socketToUserRole = new Map<string, string>();
  private socketToUserInfo = new Map<string, UserInfo>();

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { classId: string; userId: string; role?: string; userName?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { classId, userId, role = 'student', userName } = data;
    
    client.join(classId);
    this.socketToRoom.set(client.id, classId);
    this.socketToUserRole.set(client.id, role);
    this.socketToUserInfo.set(client.id, { userId, userName, role });

    // Notificar outros participantes sobre o novo participante
    client.to(classId).emit('user-connected', { userId, socketId: client.id, role, userName });

    client.on('disconnect', () => {
      const roomId = this.socketToRoom.get(client.id);
      if (roomId) {
        client.to(roomId).emit('user-disconnected', { userId, socketId: client.id });
      }
      this.socketToRoom.delete(client.id);
      this.socketToUserRole.delete(client.id);
      this.socketToUserInfo.delete(client.id);
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() payload: { toSocketId: string, offer: any },
    @ConnectedSocket() client: Socket,
  ): void {
    client.to(payload.toSocketId).emit('offer', { fromSocketId: client.id, offer: payload.offer });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() payload: { toSocketId: string, answer: any },
    @ConnectedSocket() client: Socket,
  ): void {
    client.to(payload.toSocketId).emit('answer', { fromSocketId: client.id, answer: payload.answer });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() payload: { toSocketId: string, candidate: any },
    @ConnectedSocket() client: Socket,
  ): void {
    client.to(payload.toSocketId).emit('ice-candidate', { fromSocketId: client.id, candidate: payload.candidate });
  }

}