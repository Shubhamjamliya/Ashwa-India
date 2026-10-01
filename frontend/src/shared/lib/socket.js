import { io } from "socket.io-client"
import { getSession } from "./api"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

let socket = null

export function getSocket() {
  if (socket) return socket
  const { accessToken } = getSession()
  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
  })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
