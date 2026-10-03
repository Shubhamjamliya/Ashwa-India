import { useNavigate } from "react-router-dom"
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { useAddresses } from "../context/AddressContext"
import PageHeader from "../components/PageHeader"

export default function SavedAddresses() {
  const navigate = useNavigate()
  const { addresses, removeAddress } = useAddresses()

  const confirmDelete = (id) => {
    if (window.confirm("Delete this address? This cannot be undone.")) removeAddress(id)
  }

  const addButton = (
    <button
      type="button"
      onClick={() => navigate("/user/addresses/new")}
      aria-label="Add address"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C28D2E]"
    >
      <Plus className="h-[18px] w-[18px] text-white" />
    </button>
  )

  return (
    <div className="pb-6">
      <PageHeader title="Saved Addresses" right={addButton} />

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
          <MapPin className="h-7 w-7 text-neutral-400" />
          <p className="text-sm text-neutral-500">No saved addresses yet.</p>
          <button onClick={() => navigate("/user/addresses/new")} className="mt-2 rounded-xl bg-[#C28D2E] px-6 py-2.5 text-sm font-bold text-white">
            Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {addresses.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-[#F6E9C9]">
                <MapPin className="h-[18px] w-[18px] text-[#C28D2E]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#0F2238]">{item.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {[item.line1, item.city, item.state, item.pincode].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/user/addresses/${item.id}/edit`)} aria-label="Edit" className="flex h-7 w-7 items-center justify-center text-neutral-500">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirmDelete(item.id)} aria-label="Delete" className="flex h-7 w-7 items-center justify-center text-destructive">
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
