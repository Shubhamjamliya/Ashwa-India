import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BellRing, Calendar } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"
import BookingCard from "../components/BookingCard"
import { GROUPS, countByGroup, groupOf, sortForGroup, toTrips } from "../lib/bookingStatus"

// Every booking this transporter has accepted, grouped by where it is now.
// New requests are answered on Home, so they only show here as a pointer.
export default function Bookings() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(null)

  useEffect(() => {
    apiFetch("/transport/requests/incoming")
      .then((data) => setRequests(data.requests || []))
      .finally(() => setLoading(false))
  }, [])

  // A shared run is one trip, so it is counted and listed once.
  const trips = useMemo(() => toTrips(requests), [requests])
  const counts = useMemo(() => countByGroup(trips), [trips])
  // Open on whatever needs attention: a trip on the road, else the next upcoming one.
  const activeTab = tab || (counts.on_trip > 0 ? "on_trip" : "upcoming")
  const list = useMemo(() => sortForGroup(trips.filter((t) => groupOf(t) === activeTab), activeTab), [trips, activeTab])
  const tabLabel = GROUPS.find((g) => g.key === activeTab)?.label.toLowerCase()

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">My Bookings</h1>
          <p className="mt-0.5 text-xs text-[#A9B8CC]">Every booking you have accepted</p>
        </div>
      </div>

      {counts.new > 0 && (
        <Link to="/transporter" className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900">
          <BellRing className="h-4 w-4 shrink-0" />
          {counts.new} new request{counts.new === 1 ? "" : "s"} waiting for your answer on Home
        </Link>
      )}

      <div className="flex gap-1.5 overflow-x-auto px-4 pt-3">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setTab(g.key)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${
              activeTab === g.key ? "bg-[#0B1C33] text-white" : "border border-[#E4E1D8] bg-white text-neutral-600"
            }`}
          >
            {g.label} ({counts[g.key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-8 py-20 text-center">
          <Calendar className="h-8 w-8 text-neutral-400" />
          <p className="text-[13px] text-neutral-500">No {tabLabel} bookings.</p>
        </div>
      ) : (
        <div className="space-y-2.5 p-4">
          {list.map((req) => (
            <BookingCard key={req._id} req={req} />
          ))}
        </div>
      )}
    </div>
  )
}
