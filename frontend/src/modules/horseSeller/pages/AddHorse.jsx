import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Upload, X, Loader2, Heart } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Button } from "@/shared/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const SCOPE_OPTIONS = [
  { value: "riding", label: "Riding" },
  { value: "racing", label: "Racing" },
  { value: "breeding", label: "Breeding" },
  { value: "showing", label: "Showing" },
  { value: "pleasure", label: "Pleasure" },
  { value: "trekking", label: "Trekking" },
  { value: "therapy", label: "Therapy" },
  { value: "draught", label: "Draught" },
]

const TRAINING_OPTIONS = ["unbroken", "green", "basic", "intermediate", "advanced", "trained"]

const defaultForm = {
  category: "",
  listingType: "sale",
  name: "",
  breed: "",
  age: "",
  gender: "",
  color: "",
  height: "",
  discipline: "",
  scopeOfWork: [],
  trainingLevel: "",
  vaccinationStatus: "unknown",
  healthNotes: "",
  registry: "",
  registrationNumber: "",
  location: "",
  price: "",
  leaseRate: "",
  leasePeriod: "month",
  priceNegotiable: false,
  description: "",
  videos: [],
}

export default function AddHorse() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get("id")

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [photos, setPhotos] = useState([]) // array of { url, uploading? }
  const [loading, setLoading] = useState(Boolean(editId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)

  useEffect(() => {
    apiFetch("/marketplace/categories")
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!editId) return
    apiFetch(`/marketplace/horses/${editId}`)
      .then((data) => {
        const h = data.horse
        setForm({
          category: h.category?._id || h.category || "",
          listingType: h.listingType || "sale",
          name: h.name || "",
          discipline: h.discipline || "",
          scopeOfWork: h.scopeOfWork || [],
          trainingLevel: h.trainingLevel || "",
          vaccinationStatus: h.health?.vaccinationStatus || "unknown",
          healthNotes: h.health?.notes || "",
          registry: h.registration?.registry || "",
          registrationNumber: h.registration?.number || "",
          priceNegotiable: Boolean(h.priceNegotiable),
          videos: h.videos || [],
          breed: h.breed || "",
          age: h.age ?? "",
          gender: h.gender || "",
          color: h.color || "",
          height: h.height ?? "",
          location: h.location || "",
          price: h.price ?? "",
          leaseRate: h.leaseRate ?? "",
          leasePeriod: h.leasePeriod || "month",
          description: h.description || "",
        })
        setPhotos((h.photos || []).map((url) => ({ url })))
      })
      .catch((err) => setError(err.message || "Failed to load listing"))
      .finally(() => setLoading(false))
  }, [editId])

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handlePhotoSelect = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.")
        continue
      }
      const tempId = `${Date.now()}-${Math.random()}`
      setPhotos((prev) => [...prev, { url: null, uploading: true, tempId }])
      try {
        const uploadForm = new FormData()
        uploadForm.append("file", file)
        const res = await apiUpload("/uploads/image", { method: "POST", formData: uploadForm })
        setPhotos((prev) => prev.map((p) => (p.tempId === tempId ? { url: res.url } : p)))
      } catch (err) {
        setError(err.message || "Failed to upload image")
        setPhotos((prev) => prev.filter((p) => p.tempId !== tempId))
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.category) return setError("Select a category")
    if (!form.breed.trim()) return setError("Breed is required")
    if (form.listingType === "lease") {
      if (!form.leaseRate || Number(form.leaseRate) <= 0) return setError("Enter the lease rate")
    } else if (!form.price || Number(form.price) <= 0) {
      return setError("Enter a valid sale price")
    }

    setSaving(true)
    try {
      const payload = {
        category: form.category,
        listingType: form.listingType,
        breed: form.breed.trim(),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        color: form.color.trim() || undefined,
        height: form.height ? Number(form.height) : undefined,
        location: form.location.trim() || undefined,
        name: form.name.trim() || undefined,
        discipline: form.discipline.trim() || undefined,
        scopeOfWork: form.scopeOfWork,
        trainingLevel: form.trainingLevel || undefined,
        health: { vaccinationStatus: form.vaccinationStatus, notes: form.healthNotes.trim() },
        registration: { registry: form.registry.trim(), number: form.registrationNumber.trim() },
        ...(form.listingType === "lease"
          ? { leaseRate: Number(form.leaseRate), leasePeriod: form.leasePeriod }
          : { price: Number(form.price) }),
        priceNegotiable: form.priceNegotiable,
        description: form.description.trim() || undefined,
        photos: photos.filter((p) => p.url).map((p) => p.url),
        videos: form.videos.map((v) => v.trim()).filter(Boolean),
      }

      if (editId) {
        await apiFetch(`/marketplace/horses/${editId}`, { method: "PUT", body: payload })
      } else {
        await apiFetch("/marketplace/horses", { method: "POST", body: payload })
      }

      navigate("/seller/horses/listings")
    } catch (err) {
      setError(err.message || "Failed to save listing")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/seller/horses/listings")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Horses
        </button>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200">
            <h1 className="text-xl font-bold text-neutral-900">{editId ? "Edit Horse" : "Add Horse"}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {editId ? "Update this listing's details." : "New listings are submitted for admin approval before going live."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-xs text-neutral-400 mt-1">
                    No categories yet — propose one under Horse Category first.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Horse name</Label>
                <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. Raja" className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  value={form.breed}
                  onChange={(e) => handleChange("breed", e.target.value)}
                  placeholder="e.g. Marwari"
                  className="mt-1.5"
                />
              </div>

              {form.listingType === "lease" ? (
                <>
                  <div>
                    <Label htmlFor="leaseRate">Lease rate (INR) *</Label>
                    <Input
                      id="leaseRate"
                      type="number"
                      min="0"
                      value={form.leaseRate}
                      onChange={(e) => handleChange("leaseRate", e.target.value)}
                      placeholder="e.g. 15000"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Lease period</Label>
                    <Select value={form.leasePeriod} onValueChange={(v) => handleChange("leasePeriod", v)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Per day</SelectItem>
                        <SelectItem value="week">Per week</SelectItem>
                        <SelectItem value="month">Per month</SelectItem>
                        <SelectItem value="year">Per year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="price">Sale price (INR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="e.g. 150000"
                    className="mt-1.5"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Listing type</Label>
                <Select value={form.listingType} onValueChange={(v) => handleChange("listingType", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For sale</SelectItem>
                    <SelectItem value="lease">For lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mare">Mare</SelectItem>
                    <SelectItem value="stallion">Stallion</SelectItem>
                    <SelectItem value="gelding">Gelding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  placeholder="e.g. Bay"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="height">Height (hands)</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Temperament, training, health records, pedigree..."
                  className="mt-1.5 w-full"
                />
              </div>

              <div>
                <Label htmlFor="discipline">Discipline</Label>
                <Input id="discipline" value={form.discipline} onChange={(e) => handleChange("discipline", e.target.value)} placeholder="e.g. Dressage, Endurance" className="mt-1.5" />
              </div>

              <div>
                <Label>Training level</Label>
                <Select value={form.trainingLevel} onValueChange={(v) => handleChange("trainingLevel", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Scope of work</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {SCOPE_OPTIONS.map((opt) => {
                    const on = form.scopeOfWork.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          handleChange("scopeOfWork", on ? form.scopeOfWork.filter((v) => v !== opt.value) : [...form.scopeOfWork, opt.value])
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-primary bg-primary text-white" : "border-neutral-300 bg-white text-neutral-700"}`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label>Vaccination status</Label>
                <Select value={form.vaccinationStatus} onValueChange={(v) => handleChange("vaccinationStatus", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="unknown">Not known</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="healthNotes">Health notes</Label>
                <Input id="healthNotes" value={form.healthNotes} onChange={(e) => handleChange("healthNotes", e.target.value)} placeholder="Deworming, past illness, vet checks" className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="registry">Registry / society</Label>
                <Input id="registry" value={form.registry} onChange={(e) => handleChange("registry", e.target.value)} placeholder="e.g. Marwari Horse Society" className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="registrationNumber">Registration number</Label>
                <Input id="registrationNumber" value={form.registrationNumber} onChange={(e) => handleChange("registrationNumber", e.target.value)} className="mt-1.5" />
              </div>

              <div className="md:col-span-2">
                <Label>Videos (links)</Label>
                <div className="mt-1.5 space-y-2">
                  {form.videos.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={url} onChange={(e) => handleChange("videos", form.videos.map((v, j) => (j === i ? e.target.value : v)))} placeholder="https://youtube.com/..." />
                      <Button type="button" variant="outline" onClick={() => handleChange("videos", form.videos.filter((_, j) => j !== i))}>Remove</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => handleChange("videos", [...form.videos, ""])}>Add video link</Button>
                </div>
              </div>

              <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <input type="checkbox" checked={form.priceNegotiable} onChange={(e) => handleChange("priceNegotiable", e.target.checked)} className="h-4 w-4 accent-amber-600" />
                Price is negotiable
              </label>

              <div className="md:col-span-2">
                <Label>Photos</Label>
                <div className="mt-1.5 flex flex-wrap gap-3">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-neutral-300 bg-neutral-50">
                      {p.uploading ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                        </div>
                      ) : (
                        <>
                          <img src={getMediaUrl(p.url)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  <label
                    htmlFor="horse-photos"
                    className="w-24 h-24 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100"
                  >
                    <Upload className="w-5 h-5 text-neutral-400" />
                    <span className="text-[10px] text-neutral-400 mt-1">Add photo</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="horse-photos"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => navigate("/seller/horses/listings")} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving..." : editId ? "Update Horse" : "Add Horse"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
