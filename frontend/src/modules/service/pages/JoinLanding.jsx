import { Link } from "react-router-dom"
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  Sparkles,
} from "lucide-react"
import { useBranding } from "@/shared/context/BrandingContext"

export default function JoinLanding() {
  const { logoUrl, companyName } = useBranding()
  const displayLogo = logoUrl || "/logo.png"

  const services = [
    {
      title: "Verified Horse Marketplace",
      tag: "Buy & Sell",
      image: "/images/user/horses-buy.png",
      bg: "#FBEFD6",
      description:
        "Browse verified listings of purebred horses — Marwari, Kathiawari, Thoroughbred, Arabian, and Warmblood. Review lineage, health documents, and contact sellers directly.",
      highlights: ["Direct seller inquiries", "Verified pedigree & health info", "Clean listing management"],
    },
    {
      title: "Horse Transport & Shared Rides",
      tag: "Logistics",
      image: "/images/user/transport.png",
      bg: "#E0F4E7",
      description:
        "Safe equine transport across Indian states. Book dedicated horse floats or save up to 40% on travel costs by joining shared route runs.",
      highlights: ["Shared-ride cost savings", "Custom horse floats & ambulances", "Real-time trip coordination"],
    },
    {
      title: "Equine Professionals On-Demand",
      tag: "Healthcare & Care",
      image: "/images/user/service-providers.png",
      bg: "#E1ECFC",
      description:
        "Connect with experienced horse veterinarians, certified farriers, trainers, riding schools, and stable caretakers right at your location.",
      highlights: ["Doorstep vet & farrier visits", "Verified credentials & ratings", "Easy booking schedules"],
    },
    {
      title: "Equestrian Store & Tack",
      tag: "Gear & Feed",
      image: "/images/user/accessories.png",
      bg: "#F0E4FB",
      description:
        "A specialized marketplace for authentic saddles, bridles, grooming kits, equine nutrition, feed, and stable equipment from trusted suppliers.",
      highlights: ["Equestrian gear & tack", "Equine nutrition & supplements", "Direct manufacturer prices"],
    },
  ]

  const profiles = [
    { title: "Horse Owners & Stud Farms", desc: "List horses for sale, arrange transport, and book doctors." },
    { title: "Veterinarians & Farriers", desc: "Get direct booking requests from stables and farms in your area." },
    { title: "Equine Transporters", desc: "List your routes, fill empty trailer capacity, and increase trips." },
    { title: "Tack & Feed Businesses", desc: "Sell equestrian accessories and nutrition to a focused audience." },
    { title: "Riding Schools & Trainers", desc: "Attract new riders and manage student training programs." },
    { title: "Riders & Enthusiasts", desc: "Find horses, learn riding, and connect with India's equine network." },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-[#0F2238] antialiased">
      {/* Top Navigation — Compact & Fixed */}
      <header className="sticky top-0 z-30 border-b border-[#E7DFD1] bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2 sm:px-6 sm:py-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src={displayLogo}
              alt={companyName || "Ashwa India"}
              className="h-8 w-auto max-w-[110px] object-contain sm:h-9"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <span className="text-base font-bold tracking-tight text-[#0F2238] sm:text-lg">
              {companyName || "Ashwa India"}
            </span>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-1 rounded-lg bg-[#0F2238] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#1a385c] active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span>Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section — Compact Spacing */}
      <section className="px-4 pt-5 pb-5 sm:px-6 sm:pt-8 sm:pb-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#D9CEBA] bg-[#F2EDE4] px-2.5 py-0.5 text-[11px] font-semibold text-[#7C5A1E]">
            <Sparkles className="h-3 w-3" />
            <span>India's Dedicated Equine Platform</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F2238] sm:text-4xl sm:leading-tight">
            Everything for Horses & Equestrians in One Place
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm sm:leading-normal">
            Ashwa India connects horse owners, breeders, veterinarians, farriers, transporters, and
            equestrian businesses on a single trusted, modern platform.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C28D2E] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#a87722] active:scale-98 sm:text-sm sm:py-3 sm:px-7"
            >
              <span>Register / Join Ashwa India</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-3.5 flex items-center justify-center gap-4 text-[11px] text-neutral-500 sm:gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C28D2E]" /> Verified
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-[#C28D2E]" /> Pan-India
            </span>
            <span className="flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-[#C28D2E]" /> Direct Bookings
            </span>
          </div>
        </div>
      </section>

      {/* Services Section — Clear, Fully Visible Images & Tight Gaps */}
      <section id="services" className="border-t border-[#E7DFD1] bg-white px-3.5 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center sm:mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C28D2E]">What Ashwa India Offers</p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#0F2238] sm:text-2xl">
              Core Services & Features
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              Designed for breeders, riders, equine professionals, and transport operators.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-5">
            {services.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#E7DFD1] bg-[#FAF8F5] transition duration-200 hover:border-[#C28D2E]/60 hover:shadow-xs"
              >
                {/* Image Frame — Fully Visible using object-contain with styled pastel background */}
                <div
                  className="relative flex h-40 w-full items-center justify-center overflow-hidden sm:h-48"
                  style={{ backgroundColor: item.bg }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 rounded-md bg-[#0F2238]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                    {item.tag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                  <h3 className="text-base font-bold text-[#0F2238]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">{item.description}</p>

                  <ul className="mt-3 space-y-1.5 border-t border-[#E7DFD1]/70 pt-2.5 text-[11px] text-neutral-700">
                    {item.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#C28D2E]" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Join Section — Compact */}
      <section className="border-t border-[#E7DFD1] bg-[#FAF7F1] px-3.5 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center sm:mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C28D2E]">Community & Roles</p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#0F2238] sm:text-2xl">
              Who Can Join Ashwa India?
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              Whether you own horses, provide care, or run an equine business.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-[#E7DFD1] bg-white p-3 shadow-2xs transition hover:border-[#C28D2E]"
              >
                <h4 className="text-xs font-bold text-[#0F2238] sm:text-sm">{p.title}</h4>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Registration CTA Banner — Compact */}
          <div className="mt-6 overflow-hidden rounded-xl bg-[#0F2238] p-4 text-white shadow-sm sm:mt-8 sm:p-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-base font-bold sm:text-lg">Ready to join Ashwa India?</h3>
                <p className="mt-0.5 text-xs text-neutral-300">
                  Register your stable, profile, or business in less than 2 minutes.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#C28D2E] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#a87722] active:scale-98 sm:text-sm"
              >
                <span>Register Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — Extra bottom padding on mobile so sticky bar never covers content */}
      <footer className="border-t border-[#E7DFD1] bg-white px-4 pt-5 pb-20 text-center text-[11px] text-neutral-500 sm:px-6 sm:pb-6">
        <p className="font-semibold text-neutral-700">Ashwa India — India's Horse Community & Platform</p>
        <p className="mt-0.5 text-[10px]">AshwaIndia.com • All rights reserved</p>
        <div className="mt-2 flex justify-center gap-3 text-xs font-medium text-[#C28D2E]">
          <Link to="/register" className="hover:underline">Register</Link>
          <span>•</span>
          <Link to="/user/login" className="hover:underline">User Login</Link>
          <span>•</span>
          <Link to="/service/login" className="hover:underline">Provider Login</Link>
          <span>•</span>
          <Link to="/seller/login" className="hover:underline">Seller Login</Link>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar — Slim & Clean */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#E7DFD1] bg-white/95 p-2 backdrop-blur-md sm:hidden">
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F2238] py-2.5 text-xs font-semibold text-white shadow-sm active:scale-98"
        >
          <span>Register / Join Ashwa India</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
