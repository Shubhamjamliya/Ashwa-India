import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Mail, Lock } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { useAuth } from "@/shared/context/AuthContext"
import { useBranding } from "@/shared/context/BrandingContext"
import { apiFetch } from "@/shared/lib/api"

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { logoUrl, companyName } = useBranding()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Enter your email and password")
      return
    }
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/auth/admin/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      })
      login(data)
      const from = location.state?.from
      navigate(typeof from === "string" && from.startsWith("/admin") ? from : "/admin", { replace: true })
    } catch (err) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
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
          <p className="text-sm text-neutral-500">Admin Login</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="email"
                  placeholder="admin@ashwaindia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
