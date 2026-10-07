import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronRight, MapPin, Star, Stethoscope } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useLocationContext } from "../context/LocationContext"
import BackButton from "../components/BackButton"

export function Stars({ value, size = "h-3.5 w-3.5" }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-[#C28D2E] text-[#C28D2E]" : "text-neutral-300"}`} />
      ))}
    </span>
  )
}

// Providers offering the chosen service in the user's zone. Tap one to see the full profile.
export default function ServiceProviders() {
  const { key } = useParams()
  const navigate = useNavigate()
  const { location } = useLocationContext()
  const [serviceName, setServiceName] = useState("")
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    const query = new URLSearchParams({ serviceKey: key })
    if (location?.lat != null) {
      query.set("srcLat", location.lat)
      query.set("srcLng", location.lng)
    }
    Promise.all([apiFetch(`/services/providers?${query}`), apiFetch("/service-catalog", { auth: false })])
      .then(([providersRes, catalogRes]) => {
        setProviders(providersRes.providers || [])
        setServiceName((catalogRes.services || []).find((s) => s.key === key)?.name || key)
      })
      .catch((err) => setError(err.message || "Failed to load providers"))
      .finally(() => setLoading(false))
  }, [key, location?.lat, location?.lng])

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <BackButton variant="dark" />
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold text-white">{serviceName || "Service"}</h1>
          <p className="truncate text-[11px] text-white/60">
            {location?.label ? `Providers serving ${location.label}` : "Choose a provider to see their profile"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
          <Stethoscope className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">No providers in your area yet</p>
          <p className="text-[13px] text-neutral-500">Providers appear here when they serve your zone and are online.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/user/services/${key}/providers/${p.id}`)}
              className="flex w-full items-start gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E1ECFC]">
                {p.gallery?.[0] ? (
                  <img src={getMediaUrl(p.gallery[0])} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Stethoscope className="h-5 w-5 text-[#2563EB]" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-[#0F2238]">{p.businessName || "Provider"}</span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <Stars value={p.rating?.average || 0} />
                  <span className="text-[11px] text-neutral-500">
                    {p.rating?.count ? `${p.rating.average.toFixed(1)} (${p.rating.count})` : "New"}
                  </span>
                </span>
                {p.description && <span className="mt-1 line-clamp-2 block text-xs text-neutral-500">{p.description}</span>}
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] text-neutral-500">
                  {p.price && (
                    <span className="font-bold text-[#C28D2E]">
                      ₹{p.price.amount.toLocaleString("en-IN")} {p.price.unit === "job" ? "per job" : `per ${p.price.unit}`}
                    </span>
                  )}
                  {p.distanceKm != null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.distanceKm} km
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-neutral-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
