import { useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { getSession } from "@/shared/lib/api"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

// Listens for live server events for the signed-in role. `handlers` maps event name to a callback.
// The socket is scoped to this screen and uses that role's session, like the transporter and provider pages.
export default function useLiveEvents(role, handlers) {
  const latest = useRef(handlers)
  latest.current = handlers

  useEffect(() => {
    const { accessToken } = getSession(role)
    if (!accessToken) return undefined
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const names = Object.keys(latest.current)
    const listeners = names.map((name) => {
      const fn = (payload) => latest.current[name]?.(payload)
      socket.on(name, fn)
      return [name, fn]
    })
    return () => {
      listeners.forEach(([name, fn]) => socket.off(name, fn))
      socket.disconnect()
    }
    // Re-subscribe only when the role changes; handlers are read through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])
}
