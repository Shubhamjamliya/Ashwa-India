import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, BellRing, CreditCard, MapPin, Truck, Users, Wallet } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useAuth } from "@/shared/context/AuthContext"

function parsePoint(raw) {
  try {
    const point = JSON.parse(raw)
    return point && typeof point.lat === "number" && typeof point.lng === "number" ? point : null
  } catch {
    return null
  }
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const todayStr = () => new Date().toISOString().slice(0, 10)
const dateLabel = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
// Private options are vehicle types; shared options are other customers' accepted rides.
const optionKey = (o) => o.hostRequestId || o.vehicleType?.key

function TypeIcon({ icon, className = "h-11 w-11" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F6E9C9] ${className}`}>
      {icon ? <img src={getMediaUrl(icon)} alt="" className="h-full w-full object-contain p-1" /> : <Truck className="h-[22px] w-[22px] text-[#C28D2E]" />}
    </span>
  )
}

export default function TransportResults() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const srcRaw = searchParams.get("src")
  const dstRaw = searchParams.get("dst")
  const source = useMemo(() => parsePoint(srcRaw), [srcRaw])
  const destination = useMemo(() => parsePoint(dstRaw), [dstRaw])

  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState([])
  const [tripKm, setTripKm] = useState(null)
  const [selectedKey, setSelectedKey] = useState(null)
  const [requestType, setRequestType] = useState("private")
  const [animals, setAnimals] = useState(1)
  const [travelDate, setTravelDate] = useState("")
  const [payMethod, setPayMethod] = useState("wallet")
  const [walletBalance, setWalletBalance] = useState(null)
  const [booking, setBooking] = useState(false)
  const [sent, setSent] = useState(null)
  const [error, setError] = useState("")

  const refreshWallet = () =>
    apiFetch("/payments/wallet")
      .then((d) => setWalletBalance(Number(d.wallet?.balance) || 0))
      .catch(() => setWalletBalance(0))

  useEffect(() => {
    refreshWallet()
  }, [])

  // Guards against a slower, earlier request (e.g. the Private list) overwriting a faster,
  // later one (e.g. after switching to Shared) once it finally resolves.
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!source || !destination) return
    const thisRequestId = ++requestIdRef.current
    const isStale = () => thisRequestId !== requestIdRef.current
    if (requestType === "shared" && !travelDate) {
      setOptions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      let query = `srcLat=${source.lat}&srcLng=${source.lng}&destLat=${destination.lat}&destLng=${destination.lng}&animals=${animals}`
      if (requestType === "shared") query += `&type=shared&scheduledDate=${travelDate}`
      const data = await apiFetch(`/transport/available?${query}`)
      if (isStale()) return
      setOptions(requestType === "shared" ? data.transporters || [] : data.vehicleTypes || [])
      setTripKm(data.tripDistanceKm ?? null)
    } catch (err) {
      if (isStale()) return
      setError(err.message || "Failed to load vehicles")
    } finally {
      if (!isStale()) setLoading(false)
    }
  }, [source, destination, requestType, travelDate, animals])

  useEffect(() => {
    load()
  }, [load])

  // Preselect the first available vehicle, like a ride app.
  useEffect(() => {
    if (requestType === "private" && !selectedKey) {
      const first = options.find((o) => o.available > 0)
      if (first) setSelectedKey(optionKey(first))
    }
  }, [options, requestType, selectedKey])

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

  const selected = options.find((o) => optionKey(o) === selectedKey) || null
  const shared = requestType === "shared"

  const bookingBody = (item) =>
    shared
      ? { type: "shared", hostRequestId: item.hostRequestId, source, destination, animals, scheduledDate: travelDate }
      : { type: "private", vehicleType: item.vehicleType.key, source, destination, animals, scheduledDate: travelDate }

  const finish = (item, data) => {
    setSent({ key: optionKey(item), shared, offeredTo: data?.offeredTo || 0 })
    setBooking(false)
    refreshWallet()
  }

  const book = async (item) => {
    setBooking(true)
    setError("")
    const body = bookingBody(item)
    try {
      if (!(item.advance > 0) || payMethod === "wallet") {
        const data = await apiFetch("/transport/requests", { method: "POST", body: { ...body, method: "wallet" } })
        return finish(item, data)
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error("Could not load the payment gateway. Check your connection.")
      const order = await apiFetch("/transport/advance/razorpay-order", { method: "POST", body })
      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Ashwa India",
        description: "Transport booking advance",
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: "#C28D2E" },
        handler: async (response) => {
          try {
            const data = await apiFetch("/transport/requests", {
              method: "POST",
              body: {
                ...body,
                method: "razorpay",
                paymentIntentId: order.paymentIntentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            })
            finish(item, data)
          } catch (err) {
            setError(err.message || "Failed to book")
            setBooking(false)
          }
        },
        modal: { ondismiss: () => setBooking(false) },
      })
      razorpay.open()
    } catch (err) {
      setError(err.message || "Failed to book")
      setBooking(false)
    }
  }

  const switchType = (type) => {
    setRequestType(type)
    setSelectedKey(null)
    setSent(null)
    setOptions([])
  }

  const renderTypeTab = (type, Icon, label) => {
    const active = requestType === type
    return (
      <button
        key={type}
        onClick={() => switchType(type)}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold ${
          active ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    )
  }

  const emptyText = shared
    ? travelDate
      ? "No shared ride on this route for the selected date. Try another date or book a private vehicle."
      : "Pick a travel date to see shared rides on this route."
    : "No vehicles are set up for booking yet."

  // Checkout panel for the selected option: fare, advance, payment method, book button.
  const advance = selected?.advance || 0
  const fare = selected?.quote?.amount || 0
  const walletShort = advance > 0 && payMethod === "wallet" && walletBalance != null && walletBalance < advance
  const isSent = selected && sent?.key === selectedKey
  const unavailable = selected && !shared && !(selected.available > 0)

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-bold text-white">Choose a vehicle</h1>
          <p className="truncate text-xs text-white/60">
            {source.address} → {destination.address}
            {tripKm != null ? ` · ${tripKm} km` : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3 pt-3">
        {renderTypeTab("private", Truck, "Private")}
        {renderTypeTab("shared", Users, "Shared")}
      </div>

      <div className="mx-4 mb-3 grid grid-cols-2 gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Horses</label>
          <div className="flex h-10 items-center justify-between rounded-lg border border-[#E4E1D8] px-2">
            <button type="button" onClick={() => setAnimals((n) => Math.max(1, n - 1))} className="px-2 text-lg font-bold text-[#0F2238]" aria-label="Fewer">−</button>
            <span className="text-sm font-bold text-[#0F2238]">{animals}</span>
            <button type="button" onClick={() => setAnimals((n) => n + 1)} className="px-2 text-lg font-bold text-[#0F2238]" aria-label="More">+</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Travel date</label>
          <input
            type="date"
            value={travelDate}
            min={todayStr()}
            onChange={(e) => {
              setTravelDate(e.target.value)
              setSent(null)
            }}
            className="h-10 w-full rounded-lg border border-[#E4E1D8] px-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
        </div>
        {shared && (
          <p className="col-span-2 text-[12px] text-neutral-600">
            Share a vehicle another customer already booked on your route for the same day. They agree first, then the transporter
            confirms. You pay only your share.
          </p>
        )}
      </div>

      {error && <p className="mx-4 mb-3 rounded-xl bg-red-50 p-3 text-xs text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : options.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
          {shared ? <Users className="h-8 w-8 text-neutral-400" /> : <Truck className="h-8 w-8 text-neutral-400" />}
          <p className="text-sm text-neutral-500">{emptyText}</p>
          {shared && travelDate && (
            <button onClick={() => switchType("private")} className="mt-1 text-sm font-bold text-[#C28D2E]">
              See private vehicles
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {options.map((item) => {
            const key = optionKey(item)
            const isSelected = selectedKey === key
            const off = !shared && !(item.available > 0)
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedKey(key)
                  setSent(null)
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors ${
                  isSelected ? "border-[#C28D2E] bg-[#FBF6EC] ring-1 ring-[#C28D2E]" : "border-[#E4E1D8]"
                } ${off ? "opacity-60" : ""}`}
              >
                <TypeIcon icon={item.vehicleType?.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0F2238]">{item.vehicleType?.name || "Vehicle"}</p>
                  {shared ? (
                    <>
                      <p className="truncate text-[11px] text-neutral-500">
                        {item.transporter?.businessName || item.transporter?.name || "Transporter"} · {dateLabel(item.scheduledDate)}
                      </p>
                      {item.rideFrom && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-[#0F2238]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#C28D2E]" />
                          <span className="truncate">
                            Going {item.rideFrom.split(",")[0]} → {item.rideTo.split(",")[0]}
                          </span>
                        </p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-700">
                        <Users className="h-3 w-3" /> Your trip is on the way · {item.bookedAnimals} booked · room for {item.seatsLeft} more
                      </p>
                    </>
                  ) : (
                    <>
                      {item.vehicleType?.description && <p className="truncate text-[11px] text-neutral-500">{item.vehicleType.description}</p>}
                      <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${off ? "text-neutral-400" : "text-emerald-700"}`}>
                        <MapPin className="h-3 w-3" />
                        {off ? "Not available near you right now" : `${item.available} nearby · closest ${item.nearestKm} km away`}
                      </p>
                    </>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold text-[#0F2238]">{fmt(item.quote?.amount)}</p>
                  {shared && item.fullQuote?.amount > item.quote?.amount && (
                    <p className="text-[10px] text-neutral-400 line-through">{fmt(item.fullQuote.amount)}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && !loading && (
        <div className="mx-4 mt-4 space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          {isSent ? (
            <div className="flex items-start gap-2">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-[12px] text-[#0F2238]">
                {sent.shared
                  ? "Request sent. The customer who booked this ride will be asked to share, then the transporter confirms. "
                  : `Request sent to ${sent.offeredTo} nearby transporter${sent.offeredTo === 1 ? "" : "s"}. The first to accept gets your booking. `}
                <Link to="/user/bookings" className="font-bold text-[#C28D2E]">
                  View my bookings
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-neutral-600">{shared ? "Your share" : `${selected.vehicleType?.name} fare`}</span>
                  <span className="font-bold text-[#0F2238]">{fmt(fare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Advance to pay now</span>
                  <span className="font-extrabold text-[#C28D2E]">{fmt(advance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Pay at delivery</span>
                  <span className="font-bold text-[#0F2238]">{fmt(Math.max(0, fare - advance))}</span>
                </div>
              </div>

              {advance > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["wallet", Wallet, "Wallet", `Balance ${fmt(walletBalance)}`],
                    ["razorpay", CreditCard, "Pay online", "UPI, cards"],
                  ].map(([key, Icon, title, hint]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPayMethod(key)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left ${payMethod === key ? "border-[#C28D2E] bg-[#FBF6EC]" : "border-[#E4E1D8]"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#C28D2E]" />
                      <span>
                        <span className="block text-[12px] font-bold text-[#0F2238]">{title}</span>
                        <span className="block text-[10px] text-neutral-500">{hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {walletShort && (
                <p className="text-[11px] text-destructive">
                  Wallet balance is too low.{" "}
                  <Link to="/user/wallet" className="font-bold underline">
                    Add money
                  </Link>{" "}
                  or pay online.
                </p>
              )}

              <button
                onClick={() => book(selected)}
                disabled={booking || !travelDate || walletShort || unavailable}
                className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {booking
                  ? "Sending..."
                  : unavailable
                    ? "Not available right now"
                    : !travelDate
                      ? "Pick a travel date first"
                      : `${advance > 0 ? `Pay ${fmt(advance)} & ` : ""}${shared ? "request to share" : `book ${selected.vehicleType?.name}`}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
