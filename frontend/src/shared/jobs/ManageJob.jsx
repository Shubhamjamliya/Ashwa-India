import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Phone } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { APPLICATION_LABEL, JOB_CATEGORY_LABEL } from "./JobsBrowser"

const JOB_STATUS = {
  active: { label: "Open", cls: "bg-emerald-100 text-emerald-800" },
  paused: { label: "Paused", cls: "bg-amber-100 text-amber-800" },
  filled: { label: "Filled", cls: "bg-blue-100 text-blue-800" },
  closed: { label: "Closed", cls: "bg-neutral-200 text-neutral-700" },
}

// The poster's view of their own job: change its status and decide on each applicant.
export default function ManageJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")

  const load = useCallback(() => {
    return apiFetch(`/jobs/${id}/applicants`)
      .then((d) => {
        setJob(d.job)
        setApplications(d.applications || [])
      })
      .catch((err) => setError(err.message || "Could not load this job"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (status) => {
    setError("")
    try {
      const d = await apiFetch(`/jobs/${id}`, { method: "PATCH", body: { status } })
      setJob(d.job)
    } catch (err) {
      setError(err.message)
    }
  }

  const decide = async (application, status) => {
    setBusyId(application._id)
    setError("")
    try {
      const d = await apiFetch(`/jobs/${id}/applications/${application._id}`, { method: "PATCH", body: { status } })
      setJob(d.job)
      setApplications((prev) => prev.map((a) => (a._id === application._id ? d.application : a)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const header = (
    <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
      <button onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold text-white">{job?.title || "Your job"}</h1>
    </div>
  )

  if (loading) {
    return <div className="min-h-screen">{header}<div className="flex justify-center py-24"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div></div>
  }
  if (!job) {
    return <div className="min-h-screen">{header}<p className="px-8 py-24 text-center text-sm text-destructive">{error || "Job not found"}</p></div>
  }

  const status = JOB_STATUS[job.status] || JOB_STATUS.active
  const isOpen = job.status === "active" || job.status === "paused"

  return (
    <div className="min-h-screen pb-10">
      {header}
      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">{JOB_CATEGORY_LABEL[job.category]}</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.cls}`}>{status.label}</span>
          </div>
          <p className="mt-2 text-[13px] text-neutral-600">
            {job.city} · {job.jobType} · {job.hiredCount}/{job.openings} hired
          </p>
          {job.salaryText && <p className="mt-1 text-sm font-bold text-[#0F2238]">{job.salaryText}</p>}

          <div className="mt-3 flex gap-2">
            {job.status === "active" && <ActionButton onClick={() => setStatus("paused")}>Pause</ActionButton>}
            {job.status === "paused" && <ActionButton onClick={() => setStatus("active")}>Reopen</ActionButton>}
            {job.status !== "closed" && job.status !== "filled" && <ActionButton variant="outline" onClick={() => setStatus("closed")}>Close job</ActionButton>}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div>
          <p className="mb-2 text-sm font-bold text-[#0F2238]">Applicants ({applications.length})</p>
          {applications.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#D8D3C5] bg-white p-6 text-center text-sm text-neutral-500">
              No applications yet. People who apply will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => {
                const badge = APPLICATION_LABEL[a.status] || APPLICATION_LABEL.applied
                return (
                  <div key={a._id} className="space-y-2 rounded-2xl border border-[#E4E1D8] bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0F2238]">{a.applicantName || "Applicant"}</p>
                        <p className="text-[11px] text-neutral-500">{a.applicantModel === "Provider" ? "Service provider" : "User"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    {a.applicantPhone && (
                      <a href={`tel:${a.applicantPhone}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
                        <Phone className="h-3.5 w-3.5" /> {a.applicantPhone}
                      </a>
                    )}
                    {a.coverNote && <p className="text-[12px] text-neutral-700">“{a.coverNote}”</p>}
                    {a.resume?.url && (
                      <a href={a.resume.url} target="_blank" rel="noreferrer" className="block text-[12px] font-semibold text-[#C28D2E] underline">
                        View resume{a.resume.filename ? ` (${a.resume.filename})` : ""}
                      </a>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {a.status !== "hired" && isOpen && (
                        <ActionButton disabled={busyId === a._id} onClick={() => decide(a, "hired")}>Hire</ActionButton>
                      )}
                      {a.status !== "shortlisted" && a.status !== "hired" && (
                        <ActionButton variant="outline" disabled={busyId === a._id} onClick={() => decide(a, "shortlisted")}>Shortlist</ActionButton>
                      )}
                      {a.status !== "rejected" && a.status !== "hired" && (
                        <ActionButton variant="outline" disabled={busyId === a._id} onClick={() => decide(a, "rejected")}>Not selected</ActionButton>
                      )}
                      {a.status === "hired" && (
                        <ActionButton variant="outline" disabled={busyId === a._id} onClick={() => decide(a, "shortlisted")}>Undo hire</ActionButton>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ children, onClick, variant, disabled }) {
  const cls = variant === "outline"
    ? "border border-[#0B1C33] text-[#0B1C33]"
    : "bg-[#C28D2E] text-white"
  return (
    <button onClick={onClick} disabled={disabled} className={`h-9 rounded-xl px-3 text-[12px] font-bold disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  )
}
