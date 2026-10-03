import { useEffect, useState } from "react"
import { CalendarDays, MapPin } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"

const TYPE_LABELS = {
  "horse-show": "Horse show",
  auction: "Auction",
  competition: "Competition",
  "training-camp": "Training camp",
  exhibition: "Exhibition",
  other: "Event",
}

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/events", { auth: false })
      .then((data) => setEvents(data.events || []))
      .catch((err) => setError(err.message || "Failed to load events"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <BackButton />
        <h1 className="text-[17px] font-bold text-[#0F2238]">Horse Events</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
          <CalendarDays className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">No events right now</p>
          <p className="text-[13px] text-neutral-500">Horse shows, auctions and camps will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {events.map((event) => (
            <div key={event._id} className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
              {event.image && (
                <div className="h-40 w-full bg-[#F1EEE6]">
                  <img src={getMediaUrl(event.image)} alt={event.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="space-y-1.5 p-4">
                <span className="inline-block rounded-full bg-[#F6E9C9] px-2.5 py-0.5 text-[11px] font-bold text-[#8A6416]">
                  {TYPE_LABELS[event.eventType] || "Event"}
                </span>
                <p className="text-[15px] font-bold leading-5 text-[#0F2238]">{event.title}</p>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                  <CalendarDays className="h-3.5 w-3.5 text-[#C28D2E]" />
                  {fmtDate(event.startsAt)}
                  {event.endsAt ? ` – ${fmtDate(event.endsAt)}` : ""}
                </p>
                {event.location && (
                  <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </p>
                )}
                {event.description && <p className="pt-1 text-[13px] leading-5 text-neutral-600">{event.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
