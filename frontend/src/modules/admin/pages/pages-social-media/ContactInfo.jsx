import { useState, useEffect } from "react"
import { Mail, Phone, Save } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const storageKey = "ashwa_contact_info"

export default function ContactInfo() {
  const [data, setData] = useState({ email: "", mobile: "" })
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
          <h1 className="text-2xl font-bold text-neutral-900">Landing Page Support</h1>
          <p className="text-sm text-neutral-500 mt-1">Contact details shown on the public landing page</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Support Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="support@ashwaindia.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mobile">Support Phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="mobile"
                  value={data.mobile}
                  onChange={(e) => setData((prev) => ({ ...prev, mobile: e.target.value }))}
                  placeholder="+91 00000 00000"
                  className="pl-9"
                />
              </div>
            </div>
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
