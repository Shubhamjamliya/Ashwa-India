import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const storageKey = "ashwa_business_setup"

const fields = [
  ["companyName", "Company Name"],
  ["email", "Business Email"],
  ["phoneNumber", "Phone Number"],
  ["address", "Address"],
  ["state", "State"],
  ["pincode", "Pincode"],
  ["region", "Region"],
]

export default function BusinessSetup() {
  const [data, setData] = useState({
    companyName: "Ashwa India",
    email: "",
    phoneNumber: "",
    address: "",
    state: "",
    pincode: "",
    region: "",
  })
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setData(JSON.parse(saved))
    } catch (e) { /* ignore */ }
  }, [])

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(data))
    setSavedAt(new Date())
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Business Setup</h1>
          <p className="text-sm text-neutral-500 mt-1">Core business details for Ashwa India</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={data[key]}
                  onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="mt-1"
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
