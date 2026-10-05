import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Save, Ticket, Trash2, Wallet, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry")

const emptyCoupon = { code: "", type: "percent", value: "", minOrder: "", maxDiscount: "", usageLimit: "", expiresAt: "", active: true }

function CouponForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, expiresAt: initial.expiresAt ? initial.expiresAt.slice(0, 10) : "", maxDiscount: initial.maxDiscount ?? "" }
      : emptyCoupon
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const body = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.type === "percent" && form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: Number(form.usageLimit) || 0,
        expiresAt: form.expiresAt || undefined,
        active: form.active,
      }
      const data = initial
        ? await apiFetch(`/store/coupons/${initial._id}`, { method: "PUT", body })
        : await apiFetch("/store/coupons", { method: "POST", body })
      onSaved(data.coupon, Boolean(initial))
    } catch (err) {
      setError(err.message || "Could not save the coupon")
    } finally {
      setSaving(false)
    }
  }

  const input = "h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">{initial ? "Edit coupon" : "New coupon"}</h2>
        <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Code</label>
          <input className={`${input} uppercase`} disabled={Boolean(initial)} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" />
          {initial && <p className="mt-1 text-[11px] text-neutral-500">Codes can&apos;t be renamed.</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Discount</label>
          <select className={input} value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="percent">Percent off</option>
            <option value="flat">Flat ₹ off</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{form.type === "percent" ? "Percent (1-100)" : "Amount (₹)"}</label>
          <input type="number" min="0" className={input} value={form.value} onChange={(e) => set("value", e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Minimum order (₹)</label>
          <input type="number" min="0" className={input} value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} />
        </div>
        {form.type === "percent" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Max discount (₹, optional)</label>
            <input type="number" min="0" className={input} value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Total uses (0 = unlimited)</label>
          <input type="number" min="0" className={input} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Expires on (optional)</label>
          <input type="date" className={input} value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
        <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-amber-600" />
        Active
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  )
}

export default function CouponsPayments() {
  const [cod, setCod] = useState(false)
  const [codSaving, setCodSaving] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([apiFetch("/store/payment-options"), apiFetch("/store/coupons")])
      .then(([opts, c]) => {
        setCod(Boolean(opts.cod))
        setCoupons(c.coupons || [])
      })
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  const toggleCod = async () => {
    setCodSaving(true)
    setError("")
    try {
      const data = await apiFetch("/store/payment-options", { method: "PUT", body: { codEnabled: !cod } })
      setCod(data.cod)
    } catch (err) {
      setError(err.message || "Could not change cash on delivery")
    } finally {
      setCodSaving(false)
    }
  }

  const onSaved = (coupon, wasEdit) => {
    setCoupons((prev) => (wasEdit ? prev.map((c) => (c._id === coupon._id ? coupon : c)) : [coupon, ...prev]))
    setEditing(null)
    setCreating(false)
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return
    try {
      await apiFetch(`/store/coupons/${c._id}`, { method: "DELETE" })
      setCoupons((prev) => prev.filter((x) => x._id !== c._id))
    } catch (err) {
      setError(err.message)
    }
  }

  const showForm = creating || editing

  return (
    <div className="min-h-screen space-y-6 p-4 lg:p-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Coupons & payments</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">Control how shoppers can pay and which discount codes they can use at checkout.</p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100"><Wallet className="h-5 w-5 text-amber-700" /></div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Cash on delivery</p>
                <p className="text-xs text-neutral-500">{cod ? "Shoppers can choose to pay when the order arrives." : "Hidden from shoppers. Online payment only."}</p>
              </div>
            </div>
            <button
              onClick={toggleCod}
              disabled={codSaving}
              role="switch"
              aria-checked={cod}
              className={`relative h-7 w-12 shrink-0 rounded-full p-[3px] transition-colors disabled:opacity-60 ${cod ? "bg-emerald-600" : "bg-neutral-300"}`}
            >
              <span className={`block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${cod ? "translate-x-[20px]" : "translate-x-0"}`} />
            </button>
          </div>

          {showForm ? (
            <CouponForm initial={editing} onCancel={() => { setEditing(null); setCreating(false) }} onSaved={onSaved} />
          ) : (
            <div className="flex justify-end">
              <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" /> New coupon
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    {["Code", "Discount", "Min order", "Used", "Expires", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {coupons.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-14 text-center text-sm text-neutral-500"><Ticket className="mx-auto mb-2 h-7 w-7 text-neutral-300" />No coupons yet.</td></tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c._id} className="text-sm">
                        <td className="px-5 py-3 font-mono font-bold text-neutral-900">{c.code}</td>
                        <td className="px-5 py-3">{c.type === "percent" ? `${c.value}% off${c.maxDiscount ? ` (max ${money(c.maxDiscount)})` : ""}` : `${money(c.value)} off`}</td>
                        <td className="px-5 py-3">{c.minOrder ? money(c.minOrder) : "—"}</td>
                        <td className="px-5 py-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                        <td className="px-5 py-3 text-xs text-neutral-600">{fmtDate(c.expiresAt)}</td>
                        <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>{c.active ? "Active" : "Off"}</span></td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setCreating(false); setEditing(c); window.scrollTo({ top: 0, behavior: "smooth" }) }} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100" aria-label="Edit"><Pencil className="h-4 w-4 text-neutral-600" /></button>
                            <button onClick={() => remove(c)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50" aria-label="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
