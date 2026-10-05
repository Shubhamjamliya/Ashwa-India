import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Bookmark, BookmarkCheck, CheckCircle2, MapPin, Phone, Upload } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { APPLICATION_LABEL, JOB_CATEGORY_LABEL } from "./JobsBrowser"

// Job detail with apply and save, shared by the user and service provider apps.
export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [job, setJob] = useState(null)
  const [application, setApplication] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [showApply, setShowApply] = useState(false)
  const [isPoster, setIsPoster] = useState(false)
  const [coverNote, setCoverNote] = useState("")
  const [resume, setResume] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiFetch(`/jobs/${id}`)
      .then((d) => {
        setJob(d.job)
        setApplication(d.application)
        setSaved(d.saved)
        setIsPoster(d.isPoster)
      })
      .catch((err) => setError(err.message || "Job not found"))
      .finally(() => setLoading(false))
  }, [id])

  const toggleSave = async () => {
    try {
      const d = await apiFetch(`/jobs/${id}/save`, { method: "POST" })
      setSaved(d.saved)
    } catch (err) {
      setError(err.message)
    }
  }

  const pickResume = async (file) => {
    if (!file) return
    setError("")
    setBusy(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const d = await apiUpload("/jobs/resume", { method: "POST", formData: form })
      setResume(d.resume)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const apply = async () => {
    setBusy(true)
    setError("")
    try {
      const d = await apiFetch(`/jobs/${id}/apply`, { method: "POST", body: { coverNote, resume: resume || undefined } })
      setApplication(d.application)
      setShowApply(false)
      setNotice("Application sent. The employer will review it.")
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const header = (
    <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
      <button onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold text-white">{job?.title || "Job"}</h1>
      {job && (
        <button onClick={toggleSave} aria-label={saved ? "Remove bookmark" : "Save job"}>
          {saved ? <BookmarkCheck className="h-5 w-5 text-[#C28D2E]" /> : <Bookmark className="h-5 w-5 text-white" />}
        </button>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen">
        {header}
        <div className="flex justify-center py-24"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
      </div>
    )
  }
  if (!job) {
    return (
      <div className="min-h-screen">
        {header}
        <p className="px-8 py-24 text-center text-sm text-destructive">{error || "This job is no longer available."}</p>
      </div>
    )
  }

  // The poster's name and phone are what applicants see.
  const employer = { name: job.contact?.name || job.posterName, phone: job.contact?.phone || job.posterPhone }
  const applied = APPLICATION_LABEL[application?.status] || (application ? APPLICATION_LABEL.applied : null)

  return (
    <div className="min-h-screen pb-10">
      {header}

      <div className="space-y-4 p-4">
        {notice && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{notice}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">{JOB_CATEGORY_LABEL[job.category] || job.category}</p>
          <h2 className="mt-1 text-lg font-extrabold text-[#0F2238]">{job.title}</h2>
          <p className="text-sm text-neutral-600">{employer.name}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-neutral-600">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.address ? `${job.address}, ${job.city}` : job.city}</span>
            <span>{job.jobType}</span>
            <span>{job.openings} opening{job.openings === 1 ? "" : "s"}</span>
            {job.experienceYears > 0 && <span>{job.experienceYears}+ years experience</span>}
          </div>
          {job.salaryText && <p className="mt-3 text-sm font-bold text-[#0F2238]">{job.salaryText}</p>}
          {job.deadline && <p className="mt-1 text-[11px] text-neutral-500">Apply by {new Date(job.deadline).toLocaleDateString("en-IN")}</p>}
        </div>

        <Section title="About the job">
          <p className="whitespace-pre-line text-[13px] text-neutral-700">{job.description}</p>
        </Section>
        {job.requirements && (
          <Section title="Requirements">
            <p className="whitespace-pre-line text-[13px] text-neutral-700">{job.requirements}</p>
          </Section>
        )}

        <Section title="Posted by">
          <p className="text-sm font-bold text-[#0F2238]">{employer.name || "Member"}</p>
          <div className="mt-3 flex gap-2">
            {employer.phone && (
              <a href={`tel:${employer.phone}`} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-bold text-white">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
          </div>
        </Section>

        {isPoster ? (
          <button onClick={() => navigate(`${location.pathname}/manage`)} className="h-12 w-full rounded-2xl bg-[#0B1C33] text-sm font-bold text-white">
            Manage applicants
          </button>
        ) : applied ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-[#0F2238]">You applied for this job</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${applied.cls}`}>{applied.label}</span>
            </div>
          </div>
        ) : showApply ? (
          <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="text-sm font-bold text-[#0F2238]">Apply for this job</p>
            <textarea
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Why are you a good fit? (optional)"
              className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm outline-none focus:border-[#C28D2E]"
            />
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-[#C28D2E] p-3">
              <span className="text-[12px] font-semibold text-[#0F2238]">
                {resume ? `Resume: ${resume.filename}` : "Upload resume (PDF, up to 5 MB)"}
              </span>
              <Upload className="h-4 w-4 text-[#C28D2E]" />
              <input type="file" accept="application/pdf" className="hidden" disabled={busy} onChange={(e) => pickResume(e.target.files?.[0])} />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowApply(false)} className="h-11 flex-1 rounded-xl border border-[#E4E1D8] text-sm font-bold text-[#0F2238]">Cancel</button>
              <button onClick={apply} disabled={busy} className="h-11 flex-1 rounded-xl bg-[#C28D2E] text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Working..." : "Send application"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowApply(true)} className="h-12 w-full rounded-2xl bg-[#C28D2E] text-sm font-bold text-white">Apply now</button>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <p className="mb-2 text-sm font-bold text-[#0F2238]">{title}</p>
      {children}
    </div>
  )
}
