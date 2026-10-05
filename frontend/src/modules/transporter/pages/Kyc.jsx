import { useEffect, useState } from "react"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

const inputClass = "h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

const STATUS = {
  not_submitted: { label: "Not submitted", cls: "bg-neutral-200 text-neutral-700", Icon: Clock },
  submitted: { label: "Under review", cls: "bg-amber-100 text-amber-800", Icon: Clock },
  verified: { label: "Verified", cls: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-800", Icon: XCircle },
}

async function uploadDoc(file) {
  const form = new FormData()
  form.append("file", file)
  return (await apiUpload("/uploads/image", { method: "POST", formData: form })).url
}

function DocField({ label, value, onPick, required }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E4E1D8] bg-white p-3">
      <div>
        <p className="text-[13px] font-bold text-[#0F2238]">{label}{required && <span className="text-rose-600"> *</span>}</p>
        <p className="text-[10px] text-neutral-500">{value ? "Uploaded" : "Photo or scan (PNG, JPG, WEBP)"}</p>
      </div>
      <label className="cursor-pointer rounded-md border border-[#C28D2E] px-3 py-1.5 text-[11px] font-bold text-[#C28D2E]">
        {value ? "Replace" : "Upload"}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
    </div>
  )
}

export default function Kyc() {
  const [kyc, setKyc] = useState(null)
  const [companyType, setCompanyType] = useState("individual")
  const [docs, setDocs] = useState({ identityProof: "", businessLicense: "", gstCert: "" })
  const [gstNumber, setGstNumber] = useState("")
  const [bank, setBank] = useState({ accountName: "", accountNumber: "", ifsc: "", bankName: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")

  useEffect(() => {
    apiFetch("/transporter-ops/kyc")
      .then((d) => {
        const k = d.kyc || {}
        setKyc(k)
        if (d.companyType) setCompanyType(d.companyType)
        setDocs({
          identityProof: k.identityProof?.url || "",
          businessLicense: k.businessLicense?.url || "",
          gstCert: k.gst?.certificate?.url || "",
        })
        setGstNumber(k.gst?.number || "")
        if (k.bank) setBank({ accountName: k.bank.accountName || "", accountNumber: k.bank.accountNumber || "", ifsc: k.bank.ifsc || "", bankName: k.bank.bankName || "" })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const pick = async (key, file) => {
    setError("")
    try {
      setDocs((p) => ({ ...p, [key]: "" }))
      const url = await uploadDoc(file)
      setDocs((p) => ({ ...p, [key]: url }))
    } catch (err) {
      setError(err.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setDone("")
    try {
      const body = {
        companyType,
        identityProof: { url: docs.identityProof },
        businessLicense: { url: docs.businessLicense },
        gst: gstNumber.trim() ? { number: gstNumber.trim(), certificate: docs.gstCert ? { url: docs.gstCert } : undefined } : { number: "" },
        bank,
      }
      const d = await apiFetch("/transporter-ops/kyc", { method: "PUT", body })
      setKyc(d.kyc)
      setDone("KYC submitted. We will review it and let you know.")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const status = STATUS[kyc?.status || "not_submitted"]
  const locked = kyc?.status === "verified"

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Verification (KYC)</h1>
          <p className="text-xs text-[#A9B8CC]">Needed before you can withdraw earnings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
      ) : (
        <form onSubmit={submit} className="space-y-4 p-4">
          {status && (
            <div className={`flex items-start gap-2 rounded-xl p-3 ${status.cls}`}>
              <status.Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-bold">{status.label}</p>
                {kyc?.status === "rejected" && kyc?.rejectionReason && <p className="text-xs">Reason: {kyc.rejectionReason}</p>}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-semibold text-neutral-700">Business type</p>
            <div className="grid grid-cols-2 gap-2">
              {[["individual", "Individual"], ["company", "Company"]].map(([v, l]) => (
                <button type="button" key={v} disabled={locked} onClick={() => setCompanyType(v)} className={`rounded-xl border py-2.5 text-sm font-bold ${companyType === v ? "border-[#C28D2E] bg-[#FBEFD6] text-[#0F2238]" : "border-[#E4E1D8] bg-white text-neutral-600"}`}>{l}</button>
              ))}
            </div>
          </div>

          <DocField label="Identity proof (Aadhaar / PAN)" value={docs.identityProof} required onPick={(f) => pick("identityProof", f)} />
          <DocField label="Business licence / registration" value={docs.businessLicense} required onPick={(f) => pick("businessLicense", f)} />

          <div className="space-y-2 rounded-xl border border-[#E4E1D8] bg-white p-3">
            <p className="text-[13px] font-bold text-[#0F2238]">GST (optional)</p>
            <input className={`${inputClass} uppercase`} placeholder="GSTIN" value={gstNumber} disabled={locked} onChange={(e) => setGstNumber(e.target.value)} />
            <DocField label="GST certificate" value={docs.gstCert} onPick={(f) => pick("gstCert", f)} />
          </div>

          <div className="space-y-2 rounded-xl border border-[#E4E1D8] bg-white p-3">
            <p className="text-[13px] font-bold text-[#0F2238]">Bank account for payouts</p>
            <input className={inputClass} placeholder="Account holder name" value={bank.accountName} disabled={locked} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} />
            <input className={inputClass} placeholder="Account number" inputMode="numeric" value={bank.accountNumber} disabled={locked} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={`${inputClass} uppercase`} placeholder="IFSC" value={bank.ifsc} disabled={locked} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} />
              <input className={inputClass} placeholder="Bank name" value={bank.bankName} disabled={locked} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {done && <p className="text-xs text-emerald-700">{done}</p>}

          {!locked && (
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? "Submitting..." : "Submit for verification"}
            </button>
          )}
        </form>
      )}
    </div>
  )
}
