import { useState } from "react"
import { Bell, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Button } from "@/shared/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select"

const audiences = [
  { value: "all", label: "All Users" },
  { value: "users", label: "Horse Owners / Buyers" },
  { value: "horse-sellers", label: "Horse Sellers" },
  { value: "store-sellers", label: "Store Sellers" },
  { value: "providers", label: "Service Providers" },
  { value: "transporters", label: "Transporters" },
]

export default function NotificationBroadcast() {
  const [form, setForm] = useState({ title: "", message: "", audience: "all" })
  const [sentAt, setSentAt] = useState(null)

  const handleSend = (e) => {
    e.preventDefault()
    if (!form.title || !form.message) return
    // TODO: wire to a real broadcast-notification API once the backend endpoint exists
    setSentAt(new Date())
    setForm({ title: "", message: "", audience: form.audience })
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Broadcast Notification</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Send a push notification to a group of users</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <Label htmlFor="audience">Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. New feature: shared horse transport"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-neutral-500">
                  {sentAt ? (
                    <span className="text-emerald-600 font-medium">Queued at {sentAt.toLocaleTimeString()}</span>
                  ) : "Not wired to a real push service yet."}
                </p>
                <Button type="submit">
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
