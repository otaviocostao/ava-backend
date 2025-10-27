import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class LiveClassGateway {
  @WebSocketServer()
  server: Server;

  private socketToRoom = new Map<string, string>();

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { classId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { classId, userId } = data;
    
    client.join(classId);
    this.socketToRoom.set(client.id, classId);

    client.to(classId).emit('user-connected', { userId, socketId: client.id });

    client.on('disconnect', () => {
      const roomId = this.socketToRoom.get(client.id);
      if (roomId) {
        client.to(roomId).emit('user-disconnected', { userId, socketId: client.id });
      }
      this.socketToRoom.delete(client.id);
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