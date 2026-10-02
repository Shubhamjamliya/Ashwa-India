import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './config';
import { getSession } from './storage';

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket) return socket;
  const { accessToken } = await getSession();
  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
