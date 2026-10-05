import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { JOB_CATEGORY_LABEL } from "./JobsBrowser"

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance"]
const inputClass = "h-11 w-full rounded-xl border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

const EMPTY = {
  title: "",
  category: "trainer",
  jobType: "full-time",
  city: "",
  address: "",
  experienceYears: "0",
  salaryText: "",
  openings: "1",
  deadline: "",
  description: "",
  requirements: "",
}

// Post a job. Users and service providers both use this, from their own app.
// basePath is the app's jobs route, for example /user/jobs or /service/jobs.
export default function PostJob({ basePath }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const d = await apiFetch("/jobs", {
        method: "POST",
        body: {
          ...form,
          experienceYears: Number(form.experienceYears) || 0,
          openings: Number(form.openings) || 1,
          deadline: form.deadline || undefined,
        },
      })
      navigate(`${basePath}/${d.job._id}/manage`)
    } catch (err) {
      setError(err.message || "Could not post the job")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-white">Post a job</h1>
          <p className="text-xs text-[#A9B8CC]">Find a trainer, groom, rider or vet</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 p-4">
        <input className={inputClass} placeholder="Job title *" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {Object.entries(JOB_CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select className={inputClass} value={form.jobType} onChange={(e) => set("jobType", e.target.value)}>
            {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="City *" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          <input className={inputClass} placeholder="Stable / address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className={inputClass} inputMode="numeric" placeholder="Years exp." value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value.replace(/\D/g, ""))} />
          <input className={inputClass} inputMode="numeric" placeholder="Openings" value={form.openings} onChange={(e) => set("openings", e.target.value.replace(/\D/g, ""))} />
          <input type="date" className={inputClass} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} title="Apply by" min={new Date().toISOString().slice(0, 10)} />
        </div>
        <input className={inputClass} placeholder="Pay, e.g. ₹20,000 - ₹28,000 / month" value={form.salaryText} onChange={(e) => set("salaryText", e.target.value)} />
        <textarea className="w-full rounded-xl border border-[#E4E1D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#C28D2E]" rows={4} placeholder="Describe the work *" value={form.description} onChange={(e) => set("description", e.target.value)} required />
        <textarea className="w-full rounded-xl border border-[#E4E1D8] bg-white px-3 py-2 text-sm outline-none focus:border-[#C28D2E]" rows={3} placeholder="What you are looking for" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />

        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={saving} className="h-12 w-full rounded-2xl bg-[#C28D2E] text-sm font-bold text-white disabled:opacity-50">
          {saving ? "Posting..." : "Post job"}
        </button>
      </form>
    </div>
  )
}
