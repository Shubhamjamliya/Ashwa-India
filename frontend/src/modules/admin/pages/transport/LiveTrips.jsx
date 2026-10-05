import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

const STAGE_LABEL = {
  scheduled: "Scheduled",
  to_pickup: "Heading to pickup",
  in_transit: "In transit",
  delivered: "Delivered",
}

export default function LiveTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setError("")
    apiFetch("/transporter-ops/admin/live-trips")
      .then((d) => setTrips(d.trips || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Refresh every 30 seconds so ops can see progress without reloading the page.
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Live trips</h1>
            <p className="text-sm text-neutral-500">Accepted bookings that are scheduled or on the road. Refreshes every 30 seconds.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Transporter</th>
                <th className="px-4 py-3">Vehicle / Driver</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Pickup</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Loading...</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">No live trips right now.</td></tr>
              ) : (
                trips.map((t) => (
                  <tr key={t._id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 text-xs text-neutral-700">
                      <p>{t.source?.address}</p>
                      <p className="text-neutral-400">to {t.destination?.address}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-900">{t.transporter?.businessName || t.transporter?.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {t.vehicle?.registrationNumber || "No vehicle"}
                      <br />
                      {t.driver?.name || "No driver"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-800">
                        {STAGE_LABEL[t.stage] || "Accepted"}
                      </span>
                      {t.paused && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Paused</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {t.pickupScheduledAt ? new Date(t.pickupScheduledAt).toLocaleString("en-IN") : "Not scheduled"}
                    </td>
                    <td className="px-4 py-3 font-bold">₹{Number(t.quote?.amount || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
