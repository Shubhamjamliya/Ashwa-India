import { useState, useEffect } from "react"
import {
  Heart, Users, Shield, Clock, Star, Award, Plus, X, Save,
} from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Label } from "@/shared/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select"

const iconMap = { Heart, Users, Shield, Clock, Star, Award }
const iconOptions = ["Heart", "Users", "Shield", "Clock", "Star", "Award"]
const storageKey = "ashwa_about_us"

export default function AboutUs() {
  const [data, setData] = useState({
    appName: "Ashwa India",
    version: "1.0.0",
    description: "",
    features: [],
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

  const addFeature = () => {
    setData((prev) => ({
      ...prev,
      features: [...prev.features, { icon: "Heart", title: "", description: "" }],
    }))
  }

  const updateFeature = (index, field, value) => {
    setData((prev) => {
      const features = [...prev.features]
      features[index] = { ...features[index], [field]: value }
      return { ...prev, features }
    })
  }

  const removeFeature = (index) => {
    setData((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }))
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">About Us</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your About page content</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={data.appName}
                onChange={(e) => setData((prev) => ({ ...prev, appName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={data.version}
                onChange={(e) => setData((prev) => ({ ...prev, version: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1 w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Features</CardTitle>
            <Button onClick={addFeature} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
              Add Feature
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.features.map((feature, index) => {
              const Icon = iconMap[feature.icon] || Heart
              return (
                <Card key={index} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg p-3 shrink-0 bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label>Icon</Label>
                          <Select value={feature.icon} onValueChange={(v) => updateFeature(index, "icon", v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => updateFeature(index, "title", e.target.value)}
                            placeholder="Feature title"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={feature.description}
                            onChange={(e) => updateFeature(index, "description", e.target.value)}
                            placeholder="Feature description"
                            rows={3}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFeature(index)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {data.features.length === 0 && (
              <p className="text-center text-neutral-500 py-8">No features added yet. Click "Add Feature" to get started.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {savedAt ? (
              <span className="text-emerald-600 font-medium">Saved locally at {savedAt.toLocaleTimeString()}</span>
            ) : "Changes save locally for now."}
          </p>
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
