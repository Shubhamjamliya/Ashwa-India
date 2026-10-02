import { useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin } from "lucide-react"

export default function ChangeLocation() {
  const navigate = useNavigate()

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-lg font-bold text-[#0F2238]">Change Location</h1>
      </div>

      <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
        <MapPin className="h-7 w-7 text-neutral-400" />
        <p className="text-sm text-neutral-500">Location search is available in the mobile app for now.</p>
      </div>
    </div>
  )
}
