import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Heart, Store, Mail, Lock } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { roles } from "@/shared/constants/sidebarMenus"

const sellerTypes = [
  { key: "horse-seller", label: "Horse Seller", icon: Heart, tagline: "Sell and manage horse listings" },
  { key: "store-seller", label: "Store Seller", icon: Store, tagline: "Manage your accessories store" },
]

export default function SellerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get("type") === "store-seller" ? "store-seller" : "horse-seller"

  const [sellerType, setSellerType] = useState(initialType)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const active = sellerTypes.find((s) => s.key === sellerType)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Enter your email and password")
      return
    }
    setError("")
    // TODO: wire to real auth API once backend login endpoint exists
    localStorage.setItem("ashwa_seller_role", sellerType)
    navigate(roles[sellerType].homePath, { replace: true })
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-lg mb-3">
            A
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Ashwa India</h1>
          <p className="text-sm text-neutral-500">Seller Login</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Seller type switcher */}
          <div className="grid grid-cols-2 p-1.5 gap-1.5 bg-neutral-100">
            {sellerTypes.map((type) => {
              const Icon = type.icon
              const isActive = sellerType === type.key
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setSellerType(type.key)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            <p className="text-sm text-neutral-500 mb-5">{active.tagline}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
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

              <Button type="submit" className="w-full">
                Login as {active.label}
              </Button>
            </form>

            <p className="text-xs text-neutral-400 text-center mt-5">
              Switch the tab above to log in as the other seller type.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
