import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bookmark, BookmarkCheck, Briefcase, MapPin, Search } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

export const JOB_CATEGORY_LABEL = {
  trainer: "Trainer",
  groom: "Groom",
  "stable-manager": "Stable Manager",
  rider: "Rider",
  veterinarian: "Veterinarian",
}

export const APPLICATION_LABEL = {
  applied: { label: "Applied", cls: "bg-blue-100 text-blue-800" },
  shortlisted: { label: "Shortlisted", cls: "bg-amber-100 text-amber-800" },
  hired: { label: "Hired", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Not selected", cls: "bg-neutral-200 text-neutral-700" },
}

const TABS = [
  { key: "browse", label: "Browse" },
  { key: "applied", label: "Applied" },
  { key: "saved", label: "Saved" },
  { key: "posted", label: "Posted" },
]

// Job browser shared by the user and service provider apps.
// basePath is the app's jobs route, for example /user/jobs or /service/jobs.
export default function JobsBrowser({ basePath }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState("browse")
  const [category, setCategory] = useState("")
  const [query, setQuery] = useState("")
  const [city, setCity] = useState("")
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [saved, setSaved] = useState([])
  const [posted, setPosted] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    let request
    if (tab === "browse") {
      const params = new URLSearchParams()
      if (category) params.set("category", category)
      if (query.trim()) params.set("q", query.trim())
      if (city.trim()) params.set("city", city.trim())
      request = apiFetch(`/jobs${params.toString() ? `?${params}` : ""}`).then((d) => setJobs(d.jobs || []))
    } else if (tab === "applied") {
      request = apiFetch("/jobs/mine/applications").then((d) => setApplications(d.applications || []))
    } else if (tab === "posted") {
      request = apiFetch("/jobs/mine/posted").then((d) => setPosted(d.jobs || []))
    } else {
      request = apiFetch("/jobs/mine/saved").then((d) => setSaved(d.jobs || []))
    }
    request.catch((err) => setError(err.message || "Could not load jobs")).finally(() => setLoading(false))
  }, [tab, category, query, city])

  const toggleSave = async (job, e) => {
    e.stopPropagation()
    try {
      const d = await apiFetch(`/jobs/${job._id}/save`, { method: "POST" })
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, saved: d.saved } : j)))
      if (!d.saved) setSaved((prev) => prev.filter((j) => j._id !== job._id))
    } catch (err) {
      setError(err.message)
    }
  }

  const categories = useMemo(() => Object.entries(JOB_CATEGORY_LABEL), [])

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-bold text-white">Horse Jobs</h1>
          <p className="text-xs text-[#A9B8CC]">Find work, or post a job and hire</p>
        </div>
        <button onClick={() => navigate(`${basePath}/new`)} className="shrink-0 rounded-xl bg-[#C28D2E] px-3 py-2 text-xs font-bold text-white">
          + Post job
        </button>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-2 text-[13px] font-bold ${tab === t.key ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="space-y-3 px-4 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs"
              className="h-11 w-full rounded-xl border border-[#E4E1D8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#C28D2E]"
            />
          </div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="h-10 w-full rounded-xl border border-[#E4E1D8] bg-white px-3 text-sm outline-none focus:border-[#C28D2E]"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCategory("")} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${!category ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"}`}>All</button>
            {categories.map(([key, label]) => (
              <button key={key} onClick={() => setCategory(key)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${category === key ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 p-4">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
        ) : tab === "browse" ? (
          jobs.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">No jobs match right now. Try another category or city.</p>
          ) : (
            jobs.map((job) => (
              <JobCard key={job._id} job={job} onOpen={() => navigate(`${basePath}/${job._id}`)} onSave={(e) => toggleSave(job, e)} />
            ))
          )
        ) : tab === "posted" ? (
          posted.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">Jobs you post show up here. Tap “+ Post job” to hire.</p>
          ) : (
            posted.map((job) => (
              <button key={job._id} onClick={() => navigate(`${basePath}/${job._id}/manage`)} className="w-full rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#0F2238]">{job.title}</p>
                    <p className="text-xs text-neutral-500">{JOB_CATEGORY_LABEL[job.category]} · {job.city} · {job.hiredCount}/{job.openings} hired</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F6E9C9] px-2.5 py-1 text-[11px] font-bold text-[#8A6416]">{job.applicants} applicant{job.applicants === 1 ? "" : "s"}</span>
                </div>
              </button>
            ))
          )
        ) : tab === "applied" ? (
          applications.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">You have not applied for any job yet.</p>
          ) : (
            applications.map((a) => {
              const badge = APPLICATION_LABEL[a.status] || APPLICATION_LABEL.applied
              return (
                <button key={a._id} onClick={() => a.job && navigate(`${basePath}/${a.job._id}`)} className="w-full rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0F2238]">{a.job?.title || "Job"}</p>
                      <p className="text-xs text-neutral-500">{a.job?.employer?.name} · {a.job?.city}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
                  </div>
                </button>
              )
            })
          )
        ) : saved.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">Jobs you bookmark show up here.</p>
        ) : (
          saved.map((job) => (
            <JobCard key={job._id} job={job} onOpen={() => navigate(`${basePath}/${job._id}`)} onSave={(e) => toggleSave(job, e)} />
          ))
        )}
      </div>
    </div>
  )
}

function JobCard({ job, onOpen, onSave }) {
  return (
    <div onClick={onOpen} className="cursor-pointer rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">
            <Briefcase className="h-3.5 w-3.5" /> {JOB_CATEGORY_LABEL[job.category] || job.category}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-[#0F2238]">{job.title}</p>
          <p className="text-xs text-neutral-500">{job.employer?.name || "Employer"}</p>
        </div>
        <button onClick={onSave} aria-label={job.saved ? "Remove bookmark" : "Save job"} className="shrink-0">
          {job.saved ? <BookmarkCheck className="h-5 w-5 text-[#C28D2E]" /> : <Bookmark className="h-5 w-5 text-neutral-400" />}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-neutral-600">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.city}</span>
        <span>{job.jobType}</span>
        {job.experienceYears > 0 && <span>{job.experienceYears}+ yrs</span>}
        {job.salaryText && <span className="font-semibold text-[#0F2238]">{job.salaryText}</span>}
      </div>
      {job.applicationStatus && <p className="mt-2 text-[11px] font-bold text-blue-700">You applied · {APPLICATION_LABEL[job.applicationStatus]?.label || job.applicationStatus}</p>}
    </div>
  )
}
