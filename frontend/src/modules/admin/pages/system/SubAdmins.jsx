import { useState, useEffect } from "react"
import { UserCog, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select"

const storageKey = "ashwa_sub_admins"

const accessLevels = ["Full Access", "Users & Sellers", "Bookings & Finance", "Support Only"]

const seedAdmins = [
  { name: "Priya Nair", email: "priya.nair@ashwaindia.com", access: "Users & Sellers" },
  { name: "Karan Mehta", email: "karan.mehta@ashwaindia.com", access: "Bookings & Finance" },
]

export default function SubAdmins() {
  const [admins, setAdmins] = useState(seedAdmins)
  const [form, setForm] = useState({ name: "", email: "", access: accessLevels[0] })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setAdmins(JSON.parse(saved))
    } catch (e) { /* ignore */ }
  }, [])

  const persist = (next) => {
    setAdmins(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    persist([...admins, form])
    setForm({ name: "", email: "", access: accessLevels[0] })
  }

  const handleRemove = (email) => {
    persist(admins.filter((a) => a.email !== email))
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Sub-Admins</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Give trusted team members scoped admin access</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Sub-Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Access Level</Label>
                <Select value={form.access} onValueChange={(v) => setForm((p) => ({ ...p, access: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Button type="submit">
                  <Plus className="w-4 h-4" />
                  Add Sub-Admin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {admins.map((admin) => (
              <div key={admin.email} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{admin.name}</p>
                  <p className="text-xs text-neutral-500">{admin.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{admin.access}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(admin.email)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <CardContent className="text-center py-10 text-neutral-500">No sub-admins yet.</CardContent>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
