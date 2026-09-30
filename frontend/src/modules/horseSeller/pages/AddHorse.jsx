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

const defaultForm = {
  category: "",
  breed: "",
  age: "",
  gender: "",
  color: "",
  height: "",
  location: "",
  price: "",
  description: "",
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
          breed: h.breed || "",
          age: h.age ?? "",
          gender: h.gender || "",
          color: h.color || "",
          height: h.height ?? "",
          location: h.location || "",
          price: h.price ?? "",
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
    if (!form.price || Number(form.price) <= 0) return setError("Enter a valid price")

    setSaving(true)
    try {
      const payload = {
        category: form.category,
        breed: form.breed.trim(),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        color: form.color.trim() || undefined,
        height: form.height ? Number(form.height) : undefined,
        location: form.location.trim() || undefined,
        price: Number(form.price),
        description: form.description.trim() || undefined,
        photos: photos.filter((p) => p.url).map((p) => p.url),
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
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  value={form.breed}
                  onChange={(e) => handleChange("breed", e.target.value)}
                  placeholder="e.g. Marwari"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="price">Price (INR) *</Label>
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
