import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, Stethoscope } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"

// Services added by the admin. Tapping one opens the providers who offer it.
export default function Services() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/service-catalog", { auth: false })
      .then((data) => setServices(data.services || []))
      .catch((err) => setError(err.message || "Failed to load services"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <BackButton />
        <h1 className="text-[17px] font-bold text-[#0F2238]">Services</h1>
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
        <div className="space-y-2.5 px-4">
          {services.map((service) => (
            <button
              key={service.key}
              onClick={() => navigate(`/user/services/${service.key}`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3 text-left"
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
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
