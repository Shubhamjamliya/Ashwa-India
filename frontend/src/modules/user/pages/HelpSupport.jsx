import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronDown, Mail, MessageCircle, Phone } from "lucide-react"

const SUPPORT_PHONE = "+911234567890"
const SUPPORT_EMAIL = "support@ashwaindia.com"

const faqs = [
  {
    q: "How do I list my horse for sale?",
    a: "Register as a horse seller from the login screen, then add your listing from the seller dashboard with photos, breed, price and description.",
  },
  {
    q: "How do I buy accessories or feed?",
    a: "Browse the Accessories Store from the home screen, add items to your cart, and checkout — orders are placed directly with the seller.",
  },
  {
    q: "How do I contact a horse seller?",
    a: "Open a horse listing and send an inquiry — the seller will receive your message and contact details.",
  },
  {
    q: "How do I track my order?",
    a: "Go to the Orders tab to see the status of all your accessories store orders.",
  },
  {
    q: "Is my payment information safe?",
    a: "Ashwa India does not store card details. All transactions are coordinated directly between buyers and sellers.",
  },
]

export default function HelpSupport() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Help &amp; Support</h1>
      </div>

      <div className="px-4">
        <div className="mb-6 flex gap-2">
          <a href={`tel:${SUPPORT_PHONE}`} className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-[#E4E1D8] bg-white py-4">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6E9C9]">
              <Phone className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="text-xs font-semibold text-[#0F2238]">Call Us</span>
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-[#E4E1D8] bg-white py-4">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6E9C9]">
              <Mail className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="text-xs font-semibold text-[#0F2238]">Email Us</span>
          </a>
          <a
            href={`https://wa.me/${SUPPORT_PHONE.replace("+", "")}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-[#E4E1D8] bg-white py-4"
          >
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6E9C9]">
              <MessageCircle className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="text-xs font-semibold text-[#0F2238]">WhatsApp</span>
          </a>
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Frequently Asked Questions</p>
        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          {faqs.map((item, index) => {
            const open = openIndex === index
            return (
              <div key={item.q} className={index !== faqs.length - 1 ? "border-b border-[#E4E1D8]" : ""}>
                <button onClick={() => setOpenIndex(open ? null : index)} className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left">
                  <span className="text-[13px] font-semibold text-[#0F2238]">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="px-4 pb-3.5 text-xs leading-[18px] text-neutral-500">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
