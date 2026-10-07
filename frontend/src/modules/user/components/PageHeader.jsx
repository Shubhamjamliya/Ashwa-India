import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShoppingCart } from "lucide-react"

// Same header row as the native screens: round back button, title, optional right-side action.
export default function PageHeader({ title, right = null, onBack, icon: Icon = ArrowLeft }) {
  const navigate = useNavigate()
  const handleBack = onBack || (() => navigate(-1))

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25"
      >
        <Icon className="h-5 w-5 text-white" />
      </button>
      <h1 className="flex-1 truncate text-[17px] font-bold text-white">{title}</h1>
      {right}
    </div>
  )
}

export function CartIconButton({ count = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white"
    >
      <ShoppingCart className="h-5 w-5 text-[#0F2238]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-[#FAF7F1] bg-red-500 px-1 text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}
