import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Stethoscope } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"

// Services added by the admin. Pick one or more, then book them together at checkout.
export default function Services() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/service-catalog", { auth: false })
      .then((data) => setServices(data.services || []))
      .catch((err) => setError(err.message || "Failed to load services"))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key) => setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const goCheckout = () => {
    const chosen = services.filter((s) => selected.includes(s.key)).map((s) => ({ key: s.key, name: s.name, image: s.image }))
    navigate("/user/services/checkout", { state: { services: chosen } })
  }

  return (
    <div className={selected.length ? "pb-28" : "pb-6"}>
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <BackButton variant="dark" />
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold text-white">Services</h1>
          <p className="text-[11px] text-white/60">Select the services you need</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
          <Stethoscope className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">No services yet</p>
          <p className="text-[13px] text-neutral-500">Services will appear here as they are added.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4 pt-3">
          {services.map((service) => {
            const on = selected.includes(service.key)
            return (
              <button
                key={service.key}
                onClick={() => toggle(service.key)}
                aria-pressed={on}
                className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition ${on ? "border-[#C28D2E] ring-2 ring-[#C28D2E]/30" : "border-[#E4E1D8]"}`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E1ECFC]">
                  {service.image ? (
                    <img src={getMediaUrl(service.image)} alt={service.name} className="h-full w-full object-cover" />
                  ) : (
                    <Stethoscope className="h-6 w-6 text-[#2563EB]" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-[#0F2238]">{service.name}</span>
                  {service.description && <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">{service.description}</span>}
                </span>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-[#C28D2E] bg-[#C28D2E]" : "border-neutral-300"}`}>
                  {on && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pt-2">
          <button
            onClick={goCheckout}
            className="flex w-full max-w-[480px] items-center justify-between rounded-2xl bg-[#0B1C33] px-5 py-4 text-white shadow-xl active:scale-[0.98]"
          >
            <span className="text-sm font-semibold">
              {selected.length} service{selected.length > 1 ? "s" : ""} selected
            </span>
            <span className="text-sm font-bold text-[#C28D2E]">Continue to checkout</span>
          </button>
        </div>
      )}
    </div>
  )
}
