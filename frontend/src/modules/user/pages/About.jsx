import { useNavigate } from "react-router-dom"
import { ArrowLeft, Globe, Share2, Users } from "lucide-react"

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">About Ashwa India</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-6 flex flex-col items-center rounded-2xl bg-[#0B1C33] py-6">
          <p className="text-2xl font-extrabold text-white">
            Ashwa<span className="text-[#C28D2E]">India</span>
          </p>
          <p className="mt-1 text-xs text-[#A9B8CC]">India&apos;s Horse Network</p>
          <p className="mt-2 text-[11px] text-[#A9B8CC]">Version 1.0.0</p>
        </div>

        <p className="mb-4 text-sm leading-[21px] text-[#0F2238]">
          Ashwa India connects horse buyers, sellers and service providers across the country. From trading horses to
          sourcing feed, tack and veterinary services, our mission is to build India&apos;s most trusted equine
          community — all in one app.
        </p>
        <p className="mb-4 text-sm leading-[21px] text-[#0F2238]">
          Whether you&apos;re a breeder, a stable owner or a first-time buyer, Ashwa India gives you a transparent
          marketplace, verified sellers and a dedicated accessories store built for horse care.
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
