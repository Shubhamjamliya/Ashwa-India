import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import ProviderRegistrationForm, { emptyRegistration, validateRegistration, registrationPayload } from "../components/ProviderRegistrationForm"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

// Public page — no login or OTP. Share this link: /join
export default function ProviderJoin() {
  const [reg, setReg] = useState(emptyRegistration)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const problem = validateRegistration(reg)
    if (problem) {
      setError(problem)
      return
    }
    setError("")
    setLoading(true)
    try {
      await apiFetch("/auth/provider-join", { method: "POST", auth: false, body: registrationPayload(reg) })
      setDone(true)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const another = () => {
    setReg(emptyRegistration)
    setDone(false)
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1] px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-2 bg-[#C28D2E]" />
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0F2238]">Join Ashwaindia - India's Horse Community</h1>
            <p className="mt-1 text-sm text-neutral-500">AshwaIndia.com [Launching Soon]</p>
            <p className="mt-3 text-xs text-red-500">* Indicates required question</p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-neutral-900">Thank you for joining Ashwaindia!</h2>
              <p className="mb-6 text-sm text-neutral-500">Your response has been recorded. We'll contact you soon.</p>
              <Button variant="outline" onClick={another}>Submit another response</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProviderRegistrationForm value={reg} onChange={(patch) => setReg((prev) => ({ ...prev, ...patch }))} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center justify-between">
                <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</Button>
                <button type="button" onClick={() => setReg(emptyRegistration)} className="text-sm font-medium text-[#C28D2E]">
                  Clear form
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
