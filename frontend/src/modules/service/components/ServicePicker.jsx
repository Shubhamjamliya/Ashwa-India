import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

// Lets a provider choose from the admin-managed service catalog.
export default function ServicePicker({ value, onChange }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/service-catalog", { auth: false })
      .then((data) => setServices(data.services || []))
      .catch(() => setError("Could not load the services list. Check your connection."))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key) => {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
  }

  if (loading) return <p className="text-xs text-neutral-500">Loading services...</p>
  if (error) return <p className="text-xs text-destructive">{error}</p>
  if (services.length === 0) return <p className="text-xs text-neutral-500">No services are available yet. Please check back later.</p>

  return (
    <div className="grid grid-cols-2 gap-2">
      {services.map((service) => {
        const selected = value.includes(service.key)
        return (
          <button
            key={service.key}
            type="button"
            onClick={() => toggle(service.key)}
            className={`flex items-center gap-2 rounded-xl border p-2.5 text-left ${
              selected ? "border-[#C28D2E] bg-[#FBF6EC]" : "border-[#E4E1D8] bg-white"
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-[#C28D2E] bg-[#C28D2E]" : "border-neutral-300"}`}>
              {selected && <Check className="h-3.5 w-3.5 text-white" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-[#0F2238]">{service.name}</span>
              {service.description && <span className="block truncate text-[10px] text-neutral-500">{service.description}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
