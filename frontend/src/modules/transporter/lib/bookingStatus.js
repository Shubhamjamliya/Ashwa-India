// The one place a transporter's trip status is worked out, so Home and Bookings never disagree.
// A shared run carries several customers' bookings but is ONE trip for the transporter: it is shown once,
// with one status taken from its next stop ("Pick up Bina at Dewas").

export const STATES = {
  new: { label: "New request", group: "new", chip: "bg-amber-100 text-amber-800", bar: "bg-amber-400" },
  upcoming: { label: "Upcoming", group: "upcoming", chip: "bg-blue-100 text-blue-800", bar: "bg-blue-500" },
  to_pickup: { label: "Going to pickup", group: "on_trip", chip: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500" },
  in_transit: { label: "Horse on board", group: "on_trip", chip: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500" },
  paused: { label: "Paused", group: "on_trip", chip: "bg-orange-100 text-orange-800", bar: "bg-orange-400" },
  completed: { label: "Completed", group: "completed", chip: "bg-neutral-200 text-neutral-700", bar: "bg-neutral-400" },
  declined: { label: "Declined", group: "closed", chip: "bg-red-100 text-red-700", bar: "bg-red-400" },
  cancelled: { label: "Cancelled", group: "closed", chip: "bg-neutral-200 text-neutral-600", bar: "bg-neutral-300" },
}

// Tabs on the Bookings page, in order. New requests live on Home, where they are answered.
export const GROUPS = [
  { key: "on_trip", label: "On trip" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "closed", label: "Declined / cancelled" },
]

function singleState(req) {
  if (req.status === "pending") return STATES.new
  if (req.status === "completed") return STATES.completed
  if (req.status === "rejected") return STATES.declined
  if (req.status === "cancelled") return STATES.cancelled
  if (req.paused) return STATES.paused
  if (req.stage === "to_pickup") return STATES.to_pickup
  if (req.stage === "in_transit") return STATES.in_transit
  return STATES.upcoming
}

// A shared run's one status: finished, paused, its next stop, or not started yet.
function runState(trip) {
  const { run, bookings } = trip
  if (run.finished) return STATES.completed
  if (bookings.some((b) => b.paused)) return STATES.paused
  if (run.started && run.next) return { ...STATES.to_pickup, label: run.next.label }
  return STATES.upcoming
}

export function bookingState(trip) {
  return trip.isRun ? runState(trip) : singleState(trip)
}

export const groupOf = (trip) => bookingState(trip).group

// Turns the raw booking list into trips: each shared run becomes one entry holding all its bookings.
// The run opens on its first customer's booking, whose job page shows the whole run.
export function toTrips(requests) {
  const trips = []
  const runs = new Map()
  for (const r of requests) {
    if (!r.run) {
      trips.push(r)
      continue
    }
    const key = String(r.run.group)
    if (!runs.has(key)) {
      const trip = { isRun: true, _id: `run-${key}`, run: r.run, bookings: [] }
      runs.set(key, trip)
      trips.push(trip)
    }
    runs.get(key).bookings.push(r)
  }
  for (const trip of runs.values()) {
    trip.bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const lead = trip.bookings[0]
    Object.assign(trip, {
      openId: lead._id,
      scheduledDate: lead.scheduledDate,
      createdAt: lead.createdAt,
      respondedAt: lead.respondedAt,
      vehicleTypeInfo: lead.vehicleTypeInfo,
    })
  }
  return trips
}

// Counts per group, from the same trips the pages render.
export function countByGroup(trips) {
  const counts = { new: 0, upcoming: 0, on_trip: 0, completed: 0, closed: 0 }
  for (const t of trips) counts[groupOf(t)] += 1
  return counts
}

// On-trip and upcoming by travel date; history newest first.
export function sortForGroup(trips, group) {
  const list = [...trips]
  if (group === "upcoming" || group === "on_trip") {
    return list.sort((a, b) => String(a.scheduledDate || "9999").localeCompare(String(b.scheduledDate || "9999")))
  }
  return list.sort((a, b) => new Date(b.respondedAt || b.createdAt) - new Date(a.respondedAt || a.createdAt))
}
