import { useLocation } from "react-router-dom"

export default function PlaceholderPage({ title }) {
  const location = useLocation()
  return (
    <div className="p-6 lg:p-8">
      <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center max-w-xl mx-auto shadow-sm">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{title}</h2>
        <p className="text-sm text-neutral-500">
          This module ({location.pathname}) is scaffolded and ready to be built out.
        </p>
      </div>
    </div>
  )
}
