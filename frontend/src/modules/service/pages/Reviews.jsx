import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

function Stars({ value, size = "h-4 w-4" }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-[#C28D2E] text-[#C28D2E]" : "text-neutral-300"}`} />
      ))}
    </span>
  )
}

export default function Reviews() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/services/reviews/mine")
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load reviews"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Reviews & Ratings</h1>
          <p className="mt-0.5 text-xs text-[#A9B8CC]">What customers say about your service</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-16 text-center text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div>
              <p className="text-3xl font-extrabold text-[#0F2238]">{data.rating.count ? data.rating.average.toFixed(1) : "—"}</p>
              <Stars value={data.rating.average} />
            </div>
            <p className="text-right text-xs text-neutral-500">
              {data.rating.count} review{data.rating.count === 1 ? "" : "s"}
            </p>
          </div>

          {data.reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8D3C5] bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-[#0F2238]">No reviews yet</p>
              <p className="mt-1 text-[12px] text-neutral-500">Reviews appear after a customer rates a completed service.</p>
            </div>
          ) : (
            data.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#0F2238]">{r.userName}</p>
                  <Stars value={r.rating} size="h-3.5 w-3.5" />
                </div>
                {r.comment && <p className="mt-2 text-[13px] text-neutral-600">{r.comment}</p>}
                <p className="mt-2 text-[11px] text-neutral-400">{fmtDate(r.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
