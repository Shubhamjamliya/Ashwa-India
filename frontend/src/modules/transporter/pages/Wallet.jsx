import { useEffect, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet as WalletIcon, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import BackButton from "../components/BackButton"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

const TYPE_META = {
  wallet_credit: { label: "Credit", color: "#16a34a", icon: ArrowDownLeft, sign: "+" },
  wallet_debit: { label: "Debit", color: "#ef4444", icon: ArrowUpRight, sign: "-" },
  payout: { label: "Payout", color: "#16a34a", icon: ArrowDownLeft, sign: "+" },
  charge: { label: "Charge", color: "#ef4444", icon: ArrowUpRight, sign: "-" },
  refund: { label: "Refund", color: "#16a34a", icon: ArrowDownLeft, sign: "+" },
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Wallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTopup, setShowTopup] = useState(false)
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    const [walletRes, txRes] = await Promise.allSettled([apiFetch("/payments/wallet"), apiFetch("/payments/wallet/transactions")])
    if (walletRes.status === "fulfilled") setWallet(walletRes.value.wallet)
    if (txRes.status === "fulfilled") setTransactions(txRes.value.transactions || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleTopup = async () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setError("Enter a valid amount")
      return
    }
    setError("")
    setProcessing(true)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error("Could not load payment gateway. Check your connection.")

      const order = await apiFetch("/payments/wallet/topup/razorpay-order", { method: "POST", body: { amount: amt } })

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Ashwa India Transporter",
        description: "Wallet top-up",
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: "#C28D2E" },
        handler: async (response) => {
          try {
            await apiFetch("/payments/wallet/topup/verify", {
              method: "POST",
              body: {
                paymentIntentId: order.paymentIntentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            })
            setShowTopup(false)
            setAmount("")
            load()
          } catch (err) {
            setError(err.message || "Failed to verify payment")
          } finally {
            setProcessing(false)
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      })
      razorpay.open()
    } catch (err) {
      setError(err.message || "Failed to start top-up")
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Wallet</h1>
          <p className="mt-0.5 text-xs text-[#A9B8CC]">Your earnings and payouts</p>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-2xl bg-[#0B1C33] p-5">
          <div className="flex items-center gap-2 text-[#A9B8CC]">
            <WalletIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">Wallet Balance</span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{loading ? "—" : fmt(wallet?.balance)}</p>
          <button
            onClick={() => setShowTopup(true)}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#C28D2E] py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Money
          </button>
        </div>

        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-neutral-500">Transactions</p>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#E4E1D8] bg-white px-6 py-10 text-center">
            <WalletIcon className="h-6 w-6 text-neutral-400" />
            <p className="text-[13px] text-neutral-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => {
              const meta = TYPE_META[tx.type] || TYPE_META.wallet_credit
              const Icon = meta.icon
              return (
                <div key={tx._id} className="flex items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${meta.color}1A` }}>
                    <Icon className="h-[18px] w-[18px]" style={{ color: meta.color }} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0F2238]">{tx.description || meta.label}</p>
                    <p className="text-[11px] text-neutral-500">{fmtDate(tx.createdAt)}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: meta.color }}>
                    {meta.sign}
                    {fmt(tx.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showTopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F2238]">Add Money</h2>
              <button onClick={() => setShowTopup(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              autoFocus
            />
            {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
            <Button onClick={handleTopup} disabled={processing} className="mt-4 w-full">
              {processing ? "Processing..." : "Proceed to Pay"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
