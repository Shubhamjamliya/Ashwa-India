import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { useAddresses } from "../context/AddressContext"

export function SavedAddresses() {
  const navigate = useNavigate()
  const { addresses, removeAddress } = useAddresses()

  const confirmDelete = (id) => {
    if (window.confirm("Delete this address? This cannot be undone.")) removeAddress(id)
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-[#0F2238]">Saved Addresses</h1>
        <button onClick={() => navigate("/user/addresses/new")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C28D2E]">
          <Plus className="h-[18px] w-[18px] text-white" />
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
          <MapPin className="h-7 w-7 text-neutral-400" />
          <p className="text-sm text-neutral-500">No saved addresses yet.</p>
          <Button onClick={() => navigate("/user/addresses/new")} className="mt-2 px-6">
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {addresses.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5 rounded-2xl border border-[#E4E1D8] bg-white p-4">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-[#F6E9C9]">
                <MapPin className="h-[18px] w-[18px] text-[#C28D2E]" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F2238]">{item.label}</p>
                <p className="text-xs text-neutral-500">
                  {item.line1}, {item.city}, {item.state} {item.pincode}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/user/addresses/${item.id}/edit`)} className="flex h-7 w-7 items-center justify-center text-neutral-500">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirmDelete(item.id)} className="flex h-7 w-7 items-center justify-center text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AddressForm() {
  const navigate = useNavigate()
  const { editId } = useParams()
  const { addresses, addAddress, updateAddress } = useAddresses()
  const existing = editId ? addresses.find((a) => a.id === editId) : null

  const [label, setLabel] = useState(existing?.label || "")
  const [line1, setLine1] = useState(existing?.line1 || "")
  const [city, setCity] = useState(existing?.city || "")
  const [state, setState] = useState(existing?.state || "")
  const [pincode, setPincode] = useState(existing?.pincode || "")
  const [error, setError] = useState("")

  const handleSave = (e) => {
    e.preventDefault()
    if (!label.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError("Fill in all fields")
      return
    }
    const payload = { label: label.trim(), line1: line1.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim() }
    if (existing) updateAddress(existing.id, payload)
    else addAddress(payload)
    navigate("/user/addresses")
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#0F2238]">{existing ? "Edit Address" : "Add Address"}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-3 px-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Label</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home, Office, Farm..." />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Address Line</label>
          <Input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="House no, street, area" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">City</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">State</label>
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Pincode</label>
          <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" />
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <Button type="submit" className="mt-2 w-full">
          Save Address
        </Button>
      </form>
    </div>
  )
}
