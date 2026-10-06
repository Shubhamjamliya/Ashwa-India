import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Truck } from "lucide-react"
import LocationPicker from "@/shared/maps/LocationPicker"
import PageHeader from "../components/PageHeader"

export default function Transport() {
  const navigate = useNavigate()
  const [route, setRoute] = useState({ source: null, destination: null })

  const findTransport = () => {
    if (!route.source || !route.destination) return
    const query = new URLSearchParams({ src: JSON.stringify(route.source), dst: JSON.stringify(route.destination) })
    navigate(`/user/transport/results?${query}`)
  }

  return (
    <div className="pb-8">
      <PageHeader title="Horse Transport" titleClassName="text-[17px]" />

      <div className="space-y-4 px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[#0B1C33] p-4 text-white">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C28D2E]/20">
            <Truck className="h-6 w-6 text-[#C28D2E]" />
          </div>
          <div>
            <p className="text-sm font-bold">Where is your horse going?</p>
            <p className="text-[12px] text-[#A9B8CC]">Set the pickup and drop-off, then check the map.</p>
          </div>
        </div>

        <LocationPicker value={route} onChange={(next) => setRoute({ source: next.source, destination: next.destination })} onContinue={findTransport} />
      </div>
    </div>
  )
}
