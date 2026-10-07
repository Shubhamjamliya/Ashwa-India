import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { apiFetch } from "@/shared/lib/api"
import useLiveEvents from "@/shared/lib/useLiveEvents"

const SellerNotificationsContext = createContext(null)

const MAX_ITEMS = 30
const TOAST_LIFETIME = 6000

// Only these roles have a live feed wired up today. Other roles get an inert, always-empty context
// so AppNavbar/AppSidebar can consume the hook unconditionally without special-casing each role.
const SUPPORTED_ROLES = ["horse-seller"]

let toastSeq = 0

// Live "pending activity" feed for a seller panel: new inquiries, buyer messages, and visit requests.
// Powers the navbar bell, the sidebar's red counter badge, and transient toast popups.
export function SellerNotificationsProvider({ role, children }) {
  const [items, setItems] = useState([])
  const [toasts, setToasts] = useState([])
  const [pendingInquiries, setPendingInquiries] = useState(0)
  const [pendingVisits, setPendingVisits] = useState(0)
  const active = SUPPORTED_ROLES.includes(role)
  const inquiriesRef = useRef([])
  const visitsRef = useRef([])

  const refreshCounts = useCallback(async () => {
    if (!active) return
    try {
      const [i, v] = await Promise.all([apiFetch("/marketplace/inquiries"), apiFetch("/marketplace/visits")])
      inquiriesRef.current = i.inquiries || []
      visitsRef.current = v.visits || []
      setPendingInquiries(inquiriesRef.current.filter((inq) => inq.status === "open").length)
      setPendingVisits(visitsRef.current.filter((v2) => v2.status === "pending").length)
    } catch {
      // Best-effort — the panel's own pages still show accurate counts when opened.
    }
  }, [active])

  const pushNotification = useCallback((entry) => {
    const id = `${Date.now()}-${++toastSeq}`
    const notification = { id, time: new Date().toISOString(), read: false, ...entry }
    setItems((prev) => [notification, ...prev].slice(0, MAX_ITEMS))
    setToasts((prev) => [...prev, notification])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_LIFETIME)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  useEffect(() => {
    if (!active) return
    refreshCounts()
  }, [active, refreshCounts])

  useLiveEvents(active ? role : null, {
    "inquiry:new": async (payload) => {
      await refreshCounts()
      const inq = inquiriesRef.current.find((i) => i._id === payload?.inquiryId)
      pushNotification({
        title: "New inquiry",
        body: inq ? `${inq.buyer?.name || inq.buyer?.phone || "A buyer"} is interested in ${inq.horse?.name || inq.horse?.breed || "a horse"}` : "A buyer sent a new enquiry",
        link: "/seller/horses/inquiries",
      })
    },
    "inquiry:message": async (payload) => {
      await refreshCounts()
      const inq = inquiriesRef.current.find((i) => i._id === payload?.inquiryId)
      const text = payload?.message?.text
      pushNotification({
        title: inq ? `${inq.buyer?.name || inq.buyer?.phone || "Buyer"} · ${inq.horse?.name || inq.horse?.breed || "Horse"}` : "New message",
        body: text || "New message in a conversation",
        link: "/seller/horses/inquiries",
      })
    },
    "visit:new": async (payload) => {
      await refreshCounts()
      const visitId = payload?.visit?._id
      const visit = visitsRef.current.find((v) => v._id === visitId) || payload?.visit
      pushNotification({
        title: "New visit request",
        body: visit ? `${visit.buyer?.name || visit.buyer?.phone || "A buyer"} wants to visit ${visit.horse?.name || visit.horse?.breed || "a horse"}` : "A buyer requested a visit",
        link: "/seller/horses/inquiries",
      })
    },
  })

  const unreadCount = items.filter((n) => !n.read).length
  const pendingCount = pendingInquiries + pendingVisits

  return (
    <SellerNotificationsContext.Provider
      value={{ items, unreadCount, toasts, dismissToast, markAllRead, pendingCount, pendingInquiries, pendingVisits }}
    >
      {children}
    </SellerNotificationsContext.Provider>
  )
}

const EMPTY = { items: [], unreadCount: 0, toasts: [], dismissToast: () => {}, markAllRead: () => {}, pendingCount: 0, pendingInquiries: 0, pendingVisits: 0 }

export function useSellerNotifications() {
  return useContext(SellerNotificationsContext) || EMPTY
}
