import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Switch } from "@/shared/components/ui/switch"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const storageKey = "ashwa_customization_settings"

const defaultToggles = [
  { key: "horseMarketplace", label: "Horse Marketplace", description: "Allow sellers to list horses for sale" },
  { key: "accessoriesStore", label: "Accessories Store", description: "Allow sellers to list equestrian accessories" },
  { key: "transportSharing", label: "Transport Sharing", description: "Allow multiple bookings to share one transport trip" },
  { key: "reviews", label: "Reviews & Ratings", description: "Let users leave reviews for providers and sellers" },
  { key: "newRegistrations", label: "New Registrations", description: "Allow new users, providers, transporters and sellers to sign up" },
  { key: "maintenanceMode", label: "Maintenance Mode", description: "Temporarily disable the platform for maintenance" },
]

export default function CustomizationSettings() {
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(defaultToggles.map((t) => [t.key, t.key !== "maintenanceMode"]))
  )
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setToggles(JSON.parse(saved))
    } catch (e) { /* ignore */ }
  }, [])

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(toggles))
    setSavedAt(new Date())
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Customization Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Turn platform-wide features on or off</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage All Toggles Here</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100">
            {defaultToggles.map((t) => (
              <div key={t.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-semibold text-neutral-900">{t.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t.description}</p>
                </div>
                <Switch
                  checked={toggles[t.key]}
                  onCheckedChange={(checked) => setToggles((prev) => ({ ...prev, [t.key]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-neutral-500">
            {savedAt ? (
              <span className="text-emerald-600 font-medium">Saved locally at {savedAt.toLocaleTimeString()}</span>
            ) : "Changes save locally for now."}
          </p>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
