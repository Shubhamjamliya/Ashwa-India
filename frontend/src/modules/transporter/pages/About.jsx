import { useNavigate } from "react-router-dom"
import { ArrowLeft, Globe, Share2, Users } from "lucide-react"

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-lg font-bold text-[#0F2238]">About Ashwa India</h1>
      </div>

      <div className="px-4">
        <div className="mb-6 flex flex-col items-center rounded-2xl bg-[#0B1C33] py-6">
          <p className="text-2xl font-extrabold text-white">
            Ashwa<span className="text-[#C28D2E]">India</span>
          </p>
          <p className="mt-1 text-xs text-[#A9B8CC]">Transporter</p>
          <p className="mt-2 text-[11px] text-[#A9B8CC]">Version 1.0.0</p>
        </div>

        <p className="mb-4 text-sm leading-[21px] text-[#0F2238]">
          Ashwa India connects horse owners with trusted transporters across the country. Receive transport enquiries from
          users near you, accept the jobs that suit you, and get paid straight to your wallet.
        </p>

        <div className="mt-2 flex gap-2">
          <a href="https://ashwaindia.com" target="_blank" rel="noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F6E9C9]">
            <Globe className="h-[18px] w-[18px] text-[#C28D2E]" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F6E9C9]">
            <Users className="h-[18px] w-[18px] text-[#C28D2E]" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F6E9C9]">
            <Share2 className="h-[18px] w-[18px] text-[#C28D2E]" />
          </a>
        </div>

        <p className="mt-8 text-center text-[11px] text-neutral-500">© {new Date().getFullYear()} Ashwa India. All rights reserved.</p>
      </div>
    </div>
  )
}
