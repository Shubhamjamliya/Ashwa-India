import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, BellRing, MapPin, Truck, Users } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

function parsePoint(raw) {
  try {
    const point = JSON.parse(raw)
    return point && typeof point.lat === "number" && typeof point.lng === "number" ? point : null
  } catch {
    return null
  }
}

export default function TransportResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const srcRaw = searchParams.get("src")
  const dstRaw = searchParams.get("dst")
  const source = useMemo(() => parsePoint(srcRaw), [srcRaw])
  const destination = useMemo(() => parsePoint(dstRaw), [dstRaw])

  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [requestType, setRequestType] = useState("private")
  const [animals, setAnimals] = useState(1)
  const [sharedDate, setSharedDate] = useState("")
  const [enquiring, setEnquiring] = useState(false)
  const [sentFor, setSentFor] = useState(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!source || !destination) return
    setLoading(true)
    setError("")
    try {
      const query = `srcLat=${source.lat}&srcLng=${source.lng}&destLat=${destination.lat}&destLng=${destination.lng}`
      const data = await apiFetch(`/transport/available?${query}`)
      setOptions(data.transporters || [])
    } catch (err) {
      setError(err.message || "Failed to load transporters")
    } finally {
      setLoading(false)
    }
  }, [source, destination])

  useEffect(() => {
    load()
  }, [load])

  if (!source || !destination) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-20 text-center">
        <p className="text-sm text-neutral-500">Choose a pickup and drop-off location first.</p>
        <Link to="/user/transport" className="text-sm font-bold text-[#C28D2E]">
          Go to Horse Transport
        </Link>
      </div>
    )
  }

  const handleEnquire = async (transporterId) => {
    setEnquiring(true)
    setError("")
    try {
      await apiFetch("/transport/requests", {
        method: "POST",
        body: {
          transporterId,
          source,
          destination,
          type: requestType,
          ...(requestType === "shared" ? { animals, scheduledDate: sharedDate } : {}),
        },
      })
      setSentFor(transporterId)
    } catch (err) {
      setError(err.message || "Failed to send enquiry")
    } finally {
      setEnquiring(false)
    }
  }

  const filtered = options.filter((o) =>
    requestType === "shared"
      ? o.transporter.serviceType === "shared" || o.transporter.serviceType === "both"
      : o.transporter.serviceType === "private" || o.transporter.serviceType === "both"
  )

  const renderTypeTab = (type, Icon, label) => {
    const active = requestType === type
    return (
      <button
        key={type}
        onClick={() => setRequestType(type)}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold ${
          active ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    )
  }

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-bold text-white">Available Transport</h1>
          <p className="truncate text-xs text-white/60">
            {source.address} → {destination.address}
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3 pt-3">
        {renderTypeTab("private", Truck, "Private")}
        {renderTypeTab("shared", Users, "Shared")}
      </div>

      {requestType === "shared" && (
        <div className="mx-4 mb-3 space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-[12px] text-neutral-600">
            Shared trips run on your route with other customers on the same day. You pay for your animals and distance, so the price drops as others join.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Animals</label>
              <div className="flex h-10 items-center justify-between rounded-lg border border-[#E4E1D8] px-2">
                <button type="button" onClick={() => setAnimals((n) => Math.max(1, n - 1))} className="px-2 text-lg font-bold text-[#0F2238]">−</button>
                <span className="text-sm font-bold text-[#0F2238]">{animals}</span>
                <button type="button" onClick={() => setAnimals((n) => n + 1)} className="px-2 text-lg font-bold text-[#0F2238]">+</button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Travel date</label>
              <input
                type="date"
                value={sharedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSharedDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#E4E1D8] px-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={load} className="rounded-xl border border-[#E4E1D8] bg-white px-6 py-2.5 text-sm font-bold text-[#0F2238]">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
          <Truck className="h-8 w-8 text-neutral-400" />
          <p className="text-sm text-neutral-500">No {requestType} transporters available near your pickup location yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {filtered.map((item) => {
            const isSelected = selectedId === item.transporter.id
            const isSent = sentFor === item.transporter.id
            return (
              <button
                key={item.transporter.id}
                onClick={() => setSelectedId(item.transporter.id)}
                className={`block w-full rounded-2xl border bg-white p-4 text-left ${isSelected ? "border-[#C28D2E]" : "border-[#E4E1D8]"}`}
              >
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F6E9C9]">
                    <Truck className="h-[22px] w-[22px] text-[#C28D2E]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0F2238]">
                      {item.transporter.businessName || item.transporter.name || "Transporter"}
                    </p>
                    {item.transporter.vehicleTypes?.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-neutral-500">{item.transporter.vehicleTypes.join(", ")}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                      <MapPin className="h-3 w-3" />
                      {item.distanceFromSourceKm} km from pickup
                      {item.tripDistanceKm != null ? ` · ${item.tripDistanceKm} km trip` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-extrabold text-[#C28D2E]">₹{item.quote?.amount?.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-neutral-500">₹{item.quote?.pricePerKm}/km</p>
                    {item.quote?.baseFare > 0 && <p className="text-[10px] text-neutral-500">+ ₹{item.quote.baseFare} base</p>}
                  </div>
                </div>

                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isSent) handleEnquire(item.transporter.id)
                    }}
                    disabled={isSent || enquiring || (requestType === "shared" && !sharedDate)}
                    className="mt-3 w-full rounded-xl bg-[#C28D2E] py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {isSent ? "Enquiry Sent" : enquiring ? "Ringing..." : "Enquire (Ring Transporter)"}
                  </button>
                )}
                {isSent && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F1EEE6] p-3">
                    <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="text-[11px] text-[#0F2238]">
                      The transporter has been notified. You&apos;ll get a notification once they respond.
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
