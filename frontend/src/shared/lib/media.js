const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

export function getMediaUrl(url) {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  return `${API_ORIGIN}${url}`
}
