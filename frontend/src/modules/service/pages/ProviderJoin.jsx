import { useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ArrowLeft, AlertCircle, Sparkles } from "lucide-react"
import ProviderRegistrationForm, {
  emptyRegistration,
  validateRegistration,
  registrationPayload,
} from "../components/ProviderRegistrationForm"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { useBranding } from "@/shared/context/BrandingContext"

// Dedicated Registration Page — accessible via /register or /join/register
export default function ProviderJoin() {
  const [reg, setReg] = useState(emptyRegistration)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { logoUrl, companyName } = useBranding()
  const displayLogo = logoUrl || "/logo.png"

  const handleSubmit = async (e) => {
    e.preventDefault()
    const problem = validateRegistration(reg)
    if (problem) {
      setError(problem)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setError("")
    setLoading(true)
    try {
      await apiFetch("/auth/provider-join", {
        method: "POST",
        auth: false,
        body: registrationPayload(reg),
      })
      setDone(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setError(err.message || "Registration failed. Please check your network and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAnother = () => {
    setReg(emptyRegistration)
    setDone(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-[#0F2238] antialiased">
      {/* Top Header — Fixed & Stationary */}
      <header className="sticky top-0 z-30 border-b border-[#E7DFD1] bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/join"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition hover:text-[#0F2238] sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Services</span>
          </Link>

          <div className="flex items-center gap-2">
            <img
              src={displayLogo}
              alt={companyName || "Ashwa India"}
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <span className="font-bold text-[#0F2238]">{companyName || "Ashwa India"}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-2xl px-3.5 py-4 sm:px-6 sm:py-6">
        {done ? (
          <div className="rounded-xl border border-[#E7DFD1] bg-white p-6 text-center shadow-xs sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Sparkles className="h-3 w-3" />
              <span>Submission Received</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#0F2238] sm:text-2xl">
              Thank You for Registering!
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-neutral-600 sm:text-sm">
              Your details have been submitted to the Ashwa India team. We will review your profile and
              contact you shortly on your registered number.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Link
                to="/join"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2238] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a385c] sm:w-auto sm:text-sm"
              >
                <span>← Back to Services Overview</span>
              </Link>
              <Button
                variant="outline"
                onClick={handleRegisterAnother}
                className="w-full rounded-xl border-[#D9CEBA] py-2.5 text-xs text-[#0F2238] hover:bg-neutral-50 sm:w-auto sm:text-sm"
              >
                Register Another Profile
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div className="mb-4 rounded-xl border border-[#E7DFD1] bg-white p-4 shadow-2xs sm:p-5">
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-[#D9CEBA] bg-[#F2EDE4] px-2 py-0.5 text-[10px] font-semibold text-[#7C5A1E]">
                <span>Equestrian Community Registration</span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2238] sm:text-2xl">
                Register with Ashwa India
              </h1>
              <p className="mt-1 text-xs text-neutral-600">
                Join India's dedicated network for horse owners, stud farms, veterinarians, farriers,
                transporters, and equestrian businesses.
              </p>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="mb-3.5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-semibold">Please fix the following:</p>
                  <p className="mt-0.5 text-[11px] text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* The Modern Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProviderRegistrationForm
                value={reg}
                onChange={(patch) => setReg((prev) => ({ ...prev, ...patch }))}
              />

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Bar */}
              <div className="flex flex-col-reverse items-center justify-between gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setReg(emptyRegistration)
                    setError("")
                  }}
                  className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-800"
                >
                  Reset Form
                </button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#C28D2E] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#a87722] active:scale-98 sm:w-auto sm:px-8"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
