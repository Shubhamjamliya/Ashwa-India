import { useEffect, useState } from "react"
import { CalendarDays, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

export const EVENT_TYPE_LABELS = {
  "horse-show": "Horse show",
  auction: "Auction",
  competition: "Competition",
  "training-camp": "Training camp",
  exhibition: "Exhibition",
  other: "Other",
}

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm".
const toLocalInput = (d) => {
  if (!d) return ""
  const date = new Date(d)
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const emptyForm = {
  title: "",
  eventType: "horse-show",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  image: "",
  active: true,
}

function EventForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, startsAt: toLocalInput(initial.startsAt), endsAt: toLocalInput(initial.endsAt) }
      : emptyForm
  )
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const shownImage = preview || getMediaUrl(form.image)

  const pickFile = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Upload a PNG, JPG or WEBP image")
      return
    }
    setError("")
    setFile(picked)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError("Title is required")
    if (!form.startsAt) return setError("Pick a start date and time")

    setSaving(true)
    setError("")
    try {
      let image = form.image
      if (file) {
        const data = new FormData()
        data.append("file", file)
        const uploaded = await apiUpload("/uploads/image", { method: "POST", formData: data })
        image = uploaded.url || image
      }
      const body = {
        title: form.title.trim(),
        eventType: form.eventType,
        description: form.description.trim(),
        location: form.location.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        image,
        active: form.active,
      }
      const saved = initial
        ? await apiFetch(`/events/${initial._id}`, { method: "PUT", body })
        : await apiFetch("/events", { method: "POST", body })
      onSaved(saved.event)
    } catch (err) {
      setError(err.message || "Failed to save event")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">{initial ? "Edit event" : "New event"}</h2>
        <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100">
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div>
          <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {shownImage ? <img src={shownImage} alt="Event" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-neutral-400" />}
          </div>
          <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            <ImagePlus className="h-4 w-4" />
            {shownImage ? "Change image" : "Upload image"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} className="hidden" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Title</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. State Level Arabian Horse Show"
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Type</label>
            <select
              value={form.eventType}
              onChange={(e) => set("eventType", e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-amber-500"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Location</label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, venue"
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Starts</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Ends (optional)</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What happens at this event, entry details, contact info..."
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-700 sm:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-amber-600" />
            Show this event in the user app
          </label>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Save changes" : "Create event"}
        </button>
      </div>
    </form>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    apiFetch("/events/admin")
      .then((data) => setEvents(data.events || []))
      .catch((err) => setError(err.message || "Failed to load events"))
      .finally(() => setLoading(false))
  }, [])

  const onSaved = (event) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e._id === event._id)
      const next = exists ? prev.map((e) => (e._id === event._id ? event : e)) : [event, ...prev]
      return next.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
    })
    setEditing(null)
    setCreating(false)
  }

  const remove = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    try {
      await apiFetch(`/events/${event._id}`, { method: "DELETE" })
      setEvents((prev) => prev.filter((e) => e._id !== event._id))
    } catch (err) {
      setError(err.message || "Failed to delete event")
    }
  }

  const showForm = creating || editing

  return (
    <div className="min-h-screen space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Events</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Horse shows, auctions and camps you publish here appear under Explore → Events in the user app.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> New event
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showForm && (
        <EventForm
          initial={editing}
          onCancel={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSaved={onSaved}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                {["Event", "Type", "Starts", "Location", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-600" />
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-sm font-semibold text-neutral-700">No events yet</p>
                    <p className="text-xs text-neutral-500">Create one and it will show in the user app.</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event._id} className="text-sm">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {event.image && <img src={getMediaUrl(event.image)} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <span className="font-semibold text-neutral-900">{event.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{EVENT_TYPE_LABELS[event.eventType]}</td>
                    <td className="px-5 py-3 text-xs text-neutral-600">{fmtDate(event.startsAt)}</td>
                    <td className="px-5 py-3 text-neutral-600">{event.location || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${event.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>
                        {event.active ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setCreating(false)
                            setEditing(event)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4 text-neutral-600" />
                        </button>
                        <button onClick={() => remove(event)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50" aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
