import { useEffect, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { JOB_CATEGORY_LABEL } from "@/shared/jobs/JobsBrowser"

// Admin oversight of jobs posted by users and service providers.
// Admin can pause, reopen or close a job. Posters and applicants handle hiring themselves.
const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  filled: "bg-blue-100 text-blue-800",
  closed: "bg-neutral-200 text-neutral-700",
}
const FILTERS = ["", "active", "paused", "filled", "closed"]

export default function JobManagement() {
  const [jobs, setJobs] = useState([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    apiFetch(`/jobs/admin/jobs${status ? `?status=${status}` : ""}`)
      .then((d) => setJobs(d.jobs || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status])

  const setJobStatus = async (job, next) => {
    try {
      await apiFetch(`/jobs/admin/jobs/${job._id}`, { method: "PATCH", body: { status: next } })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Job listings</h1>
          <p className="text-sm text-neutral-500">Jobs posted by users and service providers. Pause or close any listing that breaks the rules.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((s) => (
            <button key={s || "all"} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status === s ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white text-neutral-600"}`}>
              {s ? s[0].toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Posted by</th>
                <th className="px-4 py-3">Applicants</th>
                <th className="px-4 py-3">Hired</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Loading...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">No jobs here.</td></tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j._id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{j.title}</p>
                      <p className="text-xs text-neutral-500">{JOB_CATEGORY_LABEL[j.category]} · {j.city}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-700">
                      {j.posterName || "—"}
                      <br />
                      <span className="text-neutral-500">{j.posterModel === "Provider" ? "Service provider" : "User"} · {j.posterPhone}</span>
                    </td>
                    <td className="px-4 py-3">{j.applicants}</td>
                    <td className="px-4 py-3">{j.hiredCount}/{j.openings}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_BADGE[j.status]}`}>{j.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {j.status !== "active" && j.status !== "filled" && <Button size="sm" onClick={() => setJobStatus(j, "active")}>Reopen</Button>}
                        {j.status === "active" && <Button size="sm" variant="outline" onClick={() => setJobStatus(j, "paused")}>Pause</Button>}
                        {j.status !== "closed" && <Button size="sm" variant="outline" onClick={() => setJobStatus(j, "closed")}>Close</Button>}
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
