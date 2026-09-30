import { useState } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { Heart, Store, Phone, KeyRound, User, Building2, Mail, CheckCircle2 } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { useAuth } from "@/shared/context/AuthContext"
import { useBranding } from "@/shared/context/BrandingContext"
import { apiFetch } from "@/shared/lib/api"

const sellerTypes = [
  { key: "horse-seller", label: "Horse Seller", icon: Heart, tagline: "Sell and manage horse listings" },
  { key: "store-seller", label: "Store Seller", icon: Store, tagline: "Manage your accessories store" },
]

export default function SellerLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const { logoUrl, companyName } = useBranding()
  const initialType = searchParams.get("type") === "store-seller" ? "store-seller" : "horse-seller"

  const [sellerType, setSellerType] = useState(initialType)
  const [step, setStep] = useState("phone") // "phone" | "otp" | "register" | "pending"
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [registrationToken, setRegistrationToken] = useState("")
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const active = sellerTypes.find((s) => s.key === sellerType)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/otp/request", {
        method: "POST",
        auth: false,
        body: { phone, role: sellerType },
      })
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
        body: { phone, otp, role: sellerType },
      })

      if (data.requiresRegistration) {
        setRegistrationToken(data.registrationToken)
        setStep("register")
        return
      }

      login(data)
      // Only honor a redirect-back target if it actually belongs to the role we
      // just logged in as — a stale `from` from an earlier, different-role
      // redirect (e.g. you tried /seller/store, got bounced here, then logged
      // in as horse-seller instead) must not send you to the wrong dashboard.
      const homePath = `/seller/${sellerType === "horse-seller" ? "horses" : "store"}`
      const from = location.state?.from
      navigate(from && from.startsWith(homePath) ? from : homePath, { replace: true })
    } catch (err) {
      setError(err.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name) {
      setError("Enter your name")
      return
    }
    setError("")
    setLoading(true)
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        auth: false,
        body: { registrationToken, name, businessName, email },
      })
      setStep("pending")
    } catch (err) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const switchType = (key) => {
    setSellerType(key)
    resetToPhone()
  }

  const resetToPhone = () => {
    setStep("phone")
    setOtp("")
    setError("")
    setDevOtp("")
    setRegistrationToken("")
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-14 max-w-[220px] object-contain mb-3" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-lg mb-3">
              A
            </div>
          )}
          <h1 className="text-xl font-bold text-neutral-900">{companyName}</h1>
          <p className="text-sm text-neutral-500">Seller Login</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {step !== "pending" && (
            <div className="grid grid-cols-2 p-1.5 gap-1.5 bg-neutral-100">
              {sellerTypes.map((type) => {
                const Icon = type.icon
                const isActive = sellerType === type.key
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => switchType(type.key)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="p-6">
            {step === "phone" && (
              <>
                <p className="text-sm text-neutral-500 mb-5">{active.tagline}</p>
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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
                  <p className="text-xs text-neutral-400 text-center">
                    New here? We'll ask for a few details after OTP verification.
                  </p>
                </form>
              </>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-neutral-600">
                  OTP sent to <span className="font-semibold">{phone}</span>.{" "}
                  <button type="button" onClick={resetToPhone} className="text-primary font-medium">
                    Change
                  </button>
                </p>
                {devOtp && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Dev mode: OTP is <span className="font-bold">{devOtp}</span>
                  </p>
                )}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Enter OTP</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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
                <p className="text-sm text-neutral-500 mb-1">
                  New {active.label.toLowerCase()} account for <span className="font-semibold">{phone}</span>. Complete
                  your details to submit for approval.
                </p>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="pl-9" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={sellerType === "horse-seller" ? "Your stable/farm name" : "Your store name"}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Email (optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Submit for Approval"}
                </Button>
              </form>
            )}

            {step === "pending" && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mb-1">Registration submitted</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Your {active.label.toLowerCase()} account is pending admin approval. You'll be able to log in once
                  it's approved.
                </p>
                <Button variant="outline" className="w-full" onClick={resetToPhone}>
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
