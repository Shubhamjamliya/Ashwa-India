import { useState, useEffect } from "react"
import { Textarea } from "@/shared/components/ui/textarea"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { Save } from "lucide-react"

export default function LegalPageEditor({ pageKey, title, description, defaultTitle }) {
  const storageKey = `ashwa_legal_${pageKey}`
  const [viewMode, setViewMode] = useState("edit")
  const [data, setData] = useState({ title: defaultTitle, content: "" })
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setData(JSON.parse(saved))
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey])

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(data))
    setSavedAt(new Date())
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-500 mt-1">{description}</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="border-b border-neutral-200 bg-neutral-50/50 p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              {viewMode === "preview" ? "Previewing" : "Editing"} {title}
            </span>
            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "edit" ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "preview" ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          <div className="p-6">
            {viewMode === "edit" ? (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Page Title
                  </label>
                  <Input
                    value={data.title}
                    onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Content
                </label>
                <Textarea
                  value={data.content}
                  onChange={(e) => setData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={`Enter ${title.toLowerCase()} content here...`}
                  className="min-h-[280px] w-full text-sm leading-relaxed resize-y bg-neutral-50/30"
                />
              </>
            ) : (
              <div className="min-h-[280px] w-full bg-neutral-50/30 rounded-xl border border-neutral-100 p-8">
                <h2 className="text-lg font-bold text-neutral-900 mb-3">{data.title}</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-7">
                  {data.content || "Nothing written yet."}
                </p>
              </div>
            )}
          </div>
        </div>

        {viewMode === "edit" && (
          <div className="flex items-center justify-between mt-6 p-5 bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <div className="text-sm text-neutral-500">
              {savedAt ? (
                <span className="text-emerald-600 font-medium">Saved locally at {savedAt.toLocaleTimeString()}</span>
              ) : (
                <span><span className="font-semibold text-neutral-700">Tip:</span> Changes are only published once you hit save.</span>
              )}
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
