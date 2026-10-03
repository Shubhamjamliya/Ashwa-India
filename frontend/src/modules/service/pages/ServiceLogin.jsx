import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Phone, KeyRound, User, CheckCircle2 } from "lucide-react"
import ProviderProfileFields, { profilePayload } from "../components/ProviderProfileFields"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { useAuth } from "@/shared/context/AuthContext"
import { apiFetch } from "@/shared/lib/api"

export default function ServiceLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [step, setStep] = useState("phone") // "phone" | "otp" | "register" | "pending"
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [registrationToken, setRegistrationToken] = useState("")
  const [name, setName] = useState("")
  const [profile, setProfile] = useState({ serviceTypes: [], pricing: [], serviceZones: [] })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const goHome = () => {
    const from = location.state?.from
    navigate(from && from.startsWith("/service") ? from : "/service", { replace: true })
  }

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/otp/request", { method: "POST", auth: false, body: { phone, role: "provider" } })
      setDevOtp(data.devOtp || "")
      setStep("otp")
    } catch (err) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp) {
      setError("Enter the OTP")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/otp/verify", {
        method: "POST",
        auth: false,
        body: { phone, otp, role: "provider" },
      })
      if (data.requiresRegistration) {
        setRegistrationToken(data.registrationToken)
        setStep("register")
        return
      }
      login(data)
      goHome()
    } catch (err) {
      setError(err.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Enter your name")
      return
    }
    if (!profile.serviceTypes || profile.serviceTypes.length === 0) {
      setError("Select at least one service you offer")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        auth: false,
        body: { registrationToken, name, ...profilePayload(profile) },
      })
      if (data.accessToken) {
        login(data)
        goHome()
      } else {
        setStep("pending")
      }
    } catch (err) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const resetToPhone = () => {
    setStep("phone")
    setOtp("")
    setError("")
    setDevOtp("")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F1] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C28D2E] text-lg font-bold text-white">
            A
          </div>
          <h1 className="text-xl font-bold text-[#0F2238]">Ashwa India Services</h1>
          <p className="text-sm text-neutral-500">Manage your bookings and services</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {step === "phone" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-9"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-neutral-600">
                OTP sent to <span className="font-semibold">{phone}</span>.{" "}
                <button type="button" onClick={resetToPhone} className="font-medium text-primary">
                  Change
                </button>
              </p>
              {devOtp && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-600">
                  Dev mode: OTP is <span className="font-bold">{devOtp}</span>
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Enter OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="pl-9"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="mb-1 text-sm text-neutral-500">Set up your service business profile. You can add photos later.</p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Your name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="pl-9" />
                </div>
              </div>
              <ProviderProfileFields value={profile} onChange={(patch) => setProfile((prev) => ({ ...prev, ...patch }))} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          )}

          {step === "pending" && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-neutral-900">Application Submitted</h2>
              <p className="mb-6 text-sm text-neutral-500">
                Your account is awaiting admin approval. You'll be able to sign in once it's approved.
              </p>
              <Button variant="outline" className="w-full" onClick={resetToPhone}>
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
