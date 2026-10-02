import { useEffect, useState } from "react"
import { Loader2, Package, Star } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

function Stars({ value, size = "h-4 w-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
      ))}
    </div>
  )
}

export default function StoreSellerReviews() {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({ count: 0, average: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [ratingFilter, setRatingFilter] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/store/reviews/mine")
      setReviews(data.reviews || [])
      setSummary(data.summary || { count: 0, average: 0 })
    } catch (err) {
      setError(err.message || "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = ratingFilter ? reviews.filter((r) => r.rating === ratingFilter) : reviews

  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    rating: n,
    count: reviews.filter((r) => r.rating === n).length,
  }))

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Reviews</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Ratings and feedback buyers have left on your products.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-neutral-500">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <Star className="mx-auto h-10 w-10 text-neutral-300" />
          <h3 className="mt-3 text-lg font-semibold text-neutral-700">No reviews yet</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Reviews buyers leave on your products will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
              <p className="text-4xl font-bold text-neutral-900">{summary.average.toFixed(1)}</p>
              <div className="mt-2 flex justify-center">
                <Stars value={Math.round(summary.average)} size="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                Based on {summary.count} review{summary.count === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="space-y-2">
                {ratingCounts.map(({ rating, count }) => {
                  const pct = summary.count ? (count / summary.count) * 100 : 0
                  const active = ratingFilter === rating
                  return (
                    <button
                      key={rating}
                      onClick={() => setRatingFilter(active ? 0 : rating)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        active ? "bg-amber-50" : "hover:bg-neutral-50"
                      }`}
                    >
                      <span className="w-10 shrink-0 text-xs font-semibold text-neutral-600">{rating} star</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs text-neutral-500">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredReviews.map((review) => {
              const photo = review.product?.photos?.[0]
              return (
                <div key={review._id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                        {photo ? (
                          <img src={getMediaUrl(photo)} alt={review.product?.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {review.product?.name || "Product"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {review.buyer?.name || "Anonymous"} · {fmtDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Stars value={review.rating} />
                  </div>
                  {review.comment && <p className="mt-3 text-sm text-neutral-600">{review.comment}</p>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
