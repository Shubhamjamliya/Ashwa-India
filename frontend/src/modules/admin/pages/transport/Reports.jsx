import { useEffect, useState } from "react"
import { apiFetch } from "@/shared/lib/api"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</p>
      {children}
    </div>
  )
}

function Count({ rows, labelMap, trueLabel, falseLabel }) {
  // Turns an aggregate of [{_id, count}] into a labelled list.
  const label = (id) => (labelMap ? labelMap[id] || id : id === true ? trueLabel : id === false ? falseLabel : id)
  if (!rows?.length) return <p className="text-sm text-neutral-500">No data yet.</p>
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={String(r._id)} className="flex justify-between text-sm text-neutral-700">
          <span className="capitalize">{label(r._id)}</span>
          <span className="font-bold text-neutral-900">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Reports() {
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/transporter-ops/admin/reports")
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>
  if (!data) return <div className="p-6 text-sm text-neutral-500">Loading reports...</div>

  const rev = data.revenue
  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Transport reports</h1>
          <p className="text-sm text-neutral-500">Settled bookings, fleet use and top transporters.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card title="Settled bookings"><p className="text-2xl font-extrabold">{rev.bookings}</p></Card>
          <Card title="Gross value"><p className="text-2xl font-extrabold">{fmt(rev.gross)}</p></Card>
          <Card title="Platform commission"><p className="text-2xl font-extrabold">{fmt(rev.commission)}</p></Card>
          <Card title="Paid to transporters"><p className="text-2xl font-extrabold">{fmt(rev.net)}</p></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Bookings by status">
            <Count rows={data.bookingsByStatus} labelMap={STATUS_LABEL} />
          </Card>
          <Card title="Vehicle utilisation">
            <Count rows={data.vehicleUtilisation} trueLabel="Available" falseLabel="On trip" />
          </Card>
          <Card title="Driver availability">
            <Count rows={data.driverAvailability} trueLabel="Available" falseLabel="On trip" />
          </Card>
          <Card title="Top transporters (by gross)">
            {data.topTransporters?.length ? (
              <ul className="space-y-1.5">
                {data.topTransporters.map((t, i) => (
                  <li key={i} className="flex justify-between text-sm text-neutral-700">
                    <span>{t.transporter}</span>
                    <span className="font-bold text-neutral-900">{t.trips} trips · {fmt(t.gross)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No settled trips yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
