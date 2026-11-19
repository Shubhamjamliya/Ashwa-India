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
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        {done ? (
          <div className="rounded-2xl border border-[#E7DFD1] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Submission Received</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#0F2238] sm:text-3xl">
              Thank You for Registering!
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
              Your details have been submitted to the Ashwa India team. We will review your profile and
              contact you shortly on your registered number.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/join"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2238] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1a385c] sm:w-auto"
              >
                <span>← Back to Services Overview</span>
              </Link>
              <Button
                variant="outline"
                onClick={handleRegisterAnother}
                className="w-full rounded-xl border-[#D9CEBA] py-3 text-sm text-[#0F2238] hover:bg-neutral-50 sm:w-auto"
              >
                Register Another Profile
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div className="mb-6 rounded-2xl border border-[#E7DFD1] bg-white p-6 shadow-2xs sm:p-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#D9CEBA] bg-[#F2EDE4] px-2.5 py-0.5 text-[11px] font-semibold text-[#7C5A1E]">
                <span>Equestrian Community Registration</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0F2238] sm:text-3xl">
                Register with Ashwa India
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Join India's dedicated network for horse owners, stud farms, veterinarians, farriers,
                transporters, and equestrian businesses.
              </p>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-semibold">Please fix the following:</p>
                  <p className="mt-0.5 text-xs text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* The Modern Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
