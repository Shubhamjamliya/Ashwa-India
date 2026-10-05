import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />
      ))}
    </div>
  )
}

export default function Reviews() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/transporter-ops/reviews/mine")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const avg = Number(data?.rating?.average || 0)

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Ratings & reviews</h1>
          <p className="text-xs text-[#A9B8CC]">What customers say about your trips</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-4xl font-extrabold text-[#0F2238]">{avg ? avg.toFixed(1) : "—"}</p>
              <div>
                <Stars value={Math.round(avg)} />
                <p className="mt-1 text-xs text-neutral-500">{data?.rating?.count || 0} review{data?.rating?.count === 1 ? "" : "s"}</p>
              </div>
            </div>

            {(data?.reviews || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">No reviews yet. Reviews appear after a completed trip is rated.</p>
            ) : (
              data.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#E4E1D8] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#0F2238]">{r.userName}</p>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-1 text-[13px] text-neutral-700">{r.comment}</p>}
                  <p className="mt-1 text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
