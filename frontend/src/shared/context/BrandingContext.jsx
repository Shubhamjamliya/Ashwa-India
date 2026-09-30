import { createContext, useContext, useEffect, useState } from "react"
import { getMediaUrl } from "@/shared/lib/media"

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

const BrandingContext = createContext({ companyName: "Ashwa India", logoUrl: null, faviconUrl: null, loading: true })

function setFavicon(url) {
  if (!url) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.href = url
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({ companyName: "Ashwa India", logoUrl: null, faviconUrl: null, loading: true })

  useEffect(() => {
    let cancelled = false
    fetch(`${API_ORIGIN}/api/branding`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const logoUrl = data.logo?.url ? getMediaUrl(data.logo.url) : null
        const faviconUrl = data.favicon?.url ? getMediaUrl(data.favicon.url) : null
        setBranding({ companyName: data.companyName || "Ashwa India", logoUrl, faviconUrl, loading: false })
        document.title = data.companyName || "Ashwa India"
        if (faviconUrl) setFavicon(faviconUrl)
      })
      .catch(() => {
        if (!cancelled) setBranding((prev) => ({ ...prev, loading: false }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  return useContext(BrandingContext)
}
