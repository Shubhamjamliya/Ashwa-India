import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const pad = (n) => String(n).padStart(2, "0")

// "YYYY-MM-DDTHH:mm" in local time, the same shape <input type="datetime-local"> uses.
const toLocalValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

function parseValue(value) {
  if (!value) return null
  const [datePart, timePart] = value.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  const [h, min] = (timePart || "00:00").split(":").map(Number)
  return new Date(y, (m || 1) - 1, d || 1, h || 0, min || 0)
}

const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

// Mobile-friendly replacement for <input type="datetime-local">: a tap-to-open sheet with a
// calendar grid for the date and large touch targets for the time, instead of the cramped native widget.
export default function DateTimePicker({ value, onChange, min, placeholder = "Pick a date and time" }) {
  const [open, setOpen] = useState(false)
  const selected = parseValue(value)
  const minDate = min ? parseValue(min.length === 10 ? `${min}T00:00` : min) : new Date()

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected || new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [draftDate, setDraftDate] = useState(selected || null)
  const [hour12, setHour12] = useState(selected ? ((selected.getHours() % 12) || 12) : 10)
  const [minute, setMinute] = useState(selected ? selected.getMinutes() - (selected.getMinutes() % 5) : 0)
  const [isPM, setIsPM] = useState(selected ? selected.getHours() >= 12 : false)

  useEffect(() => {
    if (!open) return
    const base = selected || new Date()
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1))
    setDraftDate(selected || null)
    setHour12(selected ? (selected.getHours() % 12) || 12 : 10)
    setMinute(selected ? selected.getMinutes() - (selected.getMinutes() % 5) : 0)
    setIsPM(selected ? selected.getHours() >= 12 : false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const canGoPrevMonth = viewMonth.getTime() > minMonthStart.getTime()

  const isPastDay = (day) => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    const minDay = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    return d.getTime() < minDay.getTime()
  }

  const confirm = () => {
    if (!draftDate) return
    let h24 = hour12 % 12
    if (isPM) h24 += 12
    const result = new Date(draftDate.getFullYear(), draftDate.getMonth(), draftDate.getDate(), h24, minute)
    onChange(toLocalValue(result))
    setOpen(false)
  }

  const displayLabel = selected
    ? selected.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-10 w-full items-center gap-2 rounded-lg border border-[#E4E1D8] bg-white px-3 text-left text-sm outline-none focus:border-[#C28D2E] ${selected ? "text-[#0F2238]" : "text-neutral-400"}`}
      >
        <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
        <span className="truncate">{displayLabel || placeholder}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => canGoPrevMonth && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                disabled={!canGoPrevMonth}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#0F2238] disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-sm font-bold text-[#0F2238]">{MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</p>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#0F2238]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 text-center">
              {DAY_LABELS.map((d, i) => (
                <span key={i} className="py-1 text-[11px] font-bold text-neutral-400">{d}</span>
              ))}
              {cells.map((day, i) => {
                if (!day) return <span key={i} />
                const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
                const disabled = isPastDay(day)
                const isSelected = sameDay(draftDate, cellDate)
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDraftDate(cellDate)}
                    className={`flex h-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isSelected ? "bg-[#0B1C33] text-white" : disabled ? "text-neutral-300" : "text-[#0F2238] hover:bg-[#F6F3EC]"
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 border-t border-[#E4E1D8] pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Time</p>
              <div className="flex items-center gap-2">
                <select
                  value={hour12}
                  onChange={(e) => setHour12(Number(e.target.value))}
                  className="h-11 flex-1 rounded-lg border border-[#E4E1D8] bg-white px-2 text-center text-base font-semibold text-[#0F2238] outline-none focus:border-[#C28D2E]"
                >
                  {HOURS_12.map((h) => (
                    <option key={h} value={h}>{pad(h)}</option>
                  ))}
                </select>
                <span className="font-bold text-[#0F2238]">:</span>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="h-11 flex-1 rounded-lg border border-[#E4E1D8] bg-white px-2 text-center text-base font-semibold text-[#0F2238] outline-none focus:border-[#C28D2E]"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{pad(m)}</option>
                  ))}
                </select>
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-[#E4E1D8]">
                  <button
                    type="button"
                    onClick={() => setIsPM(false)}
                    className={`h-11 px-3 text-sm font-bold ${!isPM ? "bg-[#0B1C33] text-white" : "bg-white text-[#0F2238]"}`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPM(true)}
                    className={`h-11 px-3 text-sm font-bold ${isPM ? "bg-[#0B1C33] text-white" : "bg-white text-[#0F2238]"}`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 flex-1 rounded-xl border border-[#E4E1D8] text-sm font-bold text-[#0F2238]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!draftDate}
                className="h-11 flex-1 rounded-xl bg-[#C28D2E] text-sm font-bold text-white disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
