import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Mail, ShieldCheck, User } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { useAuth } from "@/shared/context/AuthContext"
import { useBranding } from "@/shared/context/BrandingContext"
import { apiFetch } from "@/shared/lib/api"

function OtpBoxes({ value, onChange, autoFocus, length = 6 }) {
  const inputs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || "")

  const setDigit = (index, text) => {
    const clean = text.replace(/\D/g, "")
    if (!clean) {
      onChange(value.slice(0, index) + value.slice(index + 1))
      return
    }
    const chars = clean.split("")
    const next = value.split("")
    chars.forEach((c, i) => {
      next[index + i] = c
    })
    onChange(next.join("").slice(0, length))
    const target = Math.min(index + chars.length, length - 1)
    inputs.current[target]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
      onChange(value.slice(0, index - 1) + value.slice(index))
    }
  }

  return (
    <div className="flex justify-between">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          value={digit}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          inputMode="numeric"
          maxLength={2}
          autoFocus={autoFocus && index === 0}
          onFocus={(e) => e.target.select()}
          className={`h-[54px] w-[46px] rounded-xl border-[1.5px] text-center text-xl font-bold text-[#0F2238] outline-none ${
            digit ? "border-[#C28D2E]" : "border-[#E4E1D8]"
          }`}
        />
      ))}
    </div>
  )
}

export default function UserLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { logoUrl, companyName } = useBranding()

  const [step, setStep] = useState("phone") // "phone" | "otp" | "register"
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [registrationToken, setRegistrationToken] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const goHome = () => {
    const from = location.state?.from
    navigate(typeof from === "string" && from.startsWith("/user") ? from : "/user", { replace: true })
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
      const data = await apiFetch("/auth/otp/request", { method: "POST", auth: false, body: { phone, role: "user" } })
      setDevOtp(data.devOtp || "")
      setOtp("")
      setStep("otp")
    } catch (err) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (code) => {
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/otp/verify", { method: "POST", auth: false, body: { phone, otp: code, role: "user" } })
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

  const handleOtpChange = (value) => {
    setOtp(value)
    setError("")
    if (value.length === 6) handleVerify(value)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Enter your name")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/register", { method: "POST", auth: false, body: { registrationToken, name, email } })
      login(data)
      goHome()
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
    <div className="flex min-h-screen flex-col bg-[#0B1C33]">
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pb-14 pt-10 sm:pt-16">
        {step === "otp" && (
          <button
            type="button"
            onClick={resetToPhone}
            className="mb-4 flex h-9 w-9 items-center justify-center self-start rounded-full bg-[#132B4A]"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        )}
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className={step === "otp" ? "h-16 object-contain" : "h-20 object-contain"} />
        ) : (
          <span className={step === "otp" ? "text-5xl" : "text-6xl"}>🐎</span>
        )}
        {step !== "otp" && (
          <>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">{companyName}</h1>
            <p className="mt-1.5 text-center text-[13px] text-[#A9B8CC]">Horses, services &amp; transport — all in one place</p>
          </>
        )}
      </div>

      {/* Sheet */}
      <div className="flex flex-1 flex-col rounded-t-3xl bg-[#FAF7F1] px-6 pb-10 pt-6">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[#E4E1D8]" />

        <div className="mx-auto w-full max-w-sm">
          {step === "phone" && (
            <form onSubmit={handleRequestOtp}>
              <h2 className="text-[22px] font-extrabold text-[#0F2238]">Welcome</h2>
              <p className="mb-5 mt-1.5 text-sm text-[#64748B]">Sign in with your mobile number to continue</p>

              <div className="flex gap-2">
                <div className="flex h-12 items-center justify-center rounded-xl border border-[#E4E1D8] bg-white px-3.5">
                  <span className="text-[15px] font-bold text-[#0F2238]">🇮🇳 +91</span>
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => {
                    setError("")
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }}
                  className="h-12 flex-1 rounded-xl border-[#E4E1D8] bg-white"
                  maxLength={10}
                />
              </div>
              {error && <p className="mt-2.5 text-[13px] text-destructive">{error}</p>}

              <Button type="submit" className="mt-6 h-12 w-full rounded-xl bg-[#C28D2E] text-base font-bold hover:bg-[#ab7b26]" disabled={phone.length !== 10 || loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#64748B]" />
                <span className="text-[11px] text-[#64748B]">We&apos;ll send a one-time password to verify it&apos;s you</span>
              </div>

              <p className="mt-8 text-center text-[11px] leading-4 text-[#64748B]">
                By continuing, you agree to {companyName}&apos;s{" "}
                <span className="font-bold text-[#C28D2E]">Terms of Service</span> and{" "}
                <span className="font-bold text-[#C28D2E]">Privacy Policy</span>.
              </p>
            </form>
          )}

          {step === "otp" && (
            <div>
              <h2 className="text-[22px] font-extrabold text-[#0F2238]">Verify OTP</h2>
              <p className="mt-1.5 text-sm text-[#64748B]">
                Enter the 6-digit code sent to <span className="font-bold text-[#0F2238]">+91 {phone}</span>
              </p>

              {devOtp && (
                <div className="mt-4 inline-block rounded-md bg-[#F6E9C9] px-3 py-2">
                  <span className="text-xs text-[#8A6416]">
                    Dev mode: OTP is <span className="font-bold">{devOtp}</span>
                  </span>
                </div>
              )}

              <div className="mt-8">
                <OtpBoxes value={otp} onChange={handleOtpChange} autoFocus />
              </div>
              {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

              <Button
                type="button"
                onClick={() => handleVerify(otp)}
                className="mt-8 h-12 w-full rounded-xl bg-[#C28D2E] text-base font-bold hover:bg-[#ab7b26]"
                disabled={otp.length !== 6 || loading}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetToPhone}
                className="mt-2 h-12 w-full rounded-xl border-[#E4E1D8]"
              >
                Change phone number
              </Button>
            </div>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister}>
              <h2 className="text-[22px] font-extrabold text-[#0F2238]">Create your account</h2>
              <p className="mb-5 mt-1.5 text-sm text-[#64748B]">
                Just a couple of details to get started, <span className="font-semibold">{phone}</span>.
              </p>

              <label className="mb-1.5 block text-xs font-semibold text-[#0F2238]">Full Name</label>
              <div className="relative mb-4">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 rounded-xl border-[#E4E1D8] bg-white pl-9" />
              </div>

              <label className="mb-1.5 block text-xs font-semibold text-[#0F2238]">Email (optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-xl border-[#E4E1D8] bg-white pl-9"
                />
              </div>
              {error && <p className="mt-2.5 text-[13px] text-destructive">{error}</p>}

              <Button type="submit" className="mt-6 h-12 w-full rounded-xl bg-[#C28D2E] text-base font-bold hover:bg-[#ab7b26]" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
