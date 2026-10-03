import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronDown, Mail, MessageCircle, Phone } from "lucide-react"

const SUPPORT_PHONE = "+911234567890"
const SUPPORT_EMAIL = "support@ashwaindia.com"

const faqs = [
  {
    q: "How do I receive service requests?",
    a: "Once your account is approved, turn on the Online switch on the Home tab. Users who need your service nearby will send requests that ring you in real time.",
  },
  {
    q: "How do I get paid?",
    a: "Completed service bookings are credited to your wallet. You can view balance and transactions from the Wallet tab.",
  },
  {
    q: "How do I add money to my wallet?",
    a: "Open the Wallet tab and tap Add Money. Payments are processed securely through Razorpay.",
  },
  {
    q: "Why is my account still pending?",
    a: "New service provider accounts are reviewed by the Ashwa India admin team before they can receive requests. This usually takes a short while.",
  },
]

export default function HelpSupport() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-lg font-bold text-[#0F2238]">Help &amp; Support</h1>
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
