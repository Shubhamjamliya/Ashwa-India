import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

// Goes back in history when there is one; otherwise returns to the user home
// (pages opened directly from a bookmark or a fresh tab have no history).
export default function BackButton({ variant = "light" }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.key !== "default") navigate(-1)
    else navigate("/user")
  }

  const styles = variant === "dark" ? "bg-[#132B4A] text-white" : "border border-[#E4E1D8] bg-white text-[#0F2238]"

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${styles}`}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  )
}
