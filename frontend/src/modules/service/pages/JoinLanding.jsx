import { Link } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
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
      tagColor: "bg-amber-600 text-white",
      checkColor: "text-amber-600",
      accentBorder: "hover:border-amber-400",
      image: "/images/landing/marketplace.jpg",
      description:
        "Browse verified listings of purebred horses — Marwari, Kathiawari, Thoroughbred, Arabian, and Warmblood. Review lineage, health documents, and schedule farm visits.",
      highlights: ["Direct seller inquiries", "Verified pedigree & health info", "Schedule in-person farm visits"],
    },
    {
      title: "Horse Transport & Shared Rides",
      tag: "Logistics & GPS",
      tagColor: "bg-emerald-600 text-white",
      checkColor: "text-emerald-600",
      accentBorder: "hover:border-emerald-400",
      image: "/images/landing/transport.jpg",
      description:
        "Safe equine transport across Indian states. Book dedicated horse floats or save up to 40% on travel costs by joining shared route runs with live GPS tracking.",
      highlights: ["Shared-ride cost savings", "Custom horse floats & ambulances", "Real-time trip coordination"],
    },
    {
      title: "Equine Professionals On-Demand",
      tag: "Healthcare & Care",
      tagColor: "bg-blue-600 text-white",
      checkColor: "text-blue-600",
      accentBorder: "hover:border-blue-400",
      image: "/images/landing/services.jpg",
      description:
        "Connect with experienced horse veterinarians, certified farriers, trainers, riding schools, and stable caretakers right at your location.",
      highlights: ["Doorstep vet & farrier visits", "Verified credentials & ratings", "Easy booking schedules"],
    },
    {
      title: "Equestrian Store & Tack",
      tag: "Gear & Feed",
      tagColor: "bg-purple-600 text-white",
      checkColor: "text-purple-600",
      accentBorder: "hover:border-purple-400",
      image: "/images/landing/store.jpg",
      description:
        "A specialized marketplace for authentic saddles, bridles, grooming kits, equine nutrition, feed, and stable equipment from trusted suppliers.",
      highlights: ["Equestrian gear & tack", "Equine nutrition & supplements", "Direct manufacturer prices"],
    },
    {
      title: "Horse Events, Shows & Auctions",
      tag: "Shows & Fairs",
      tagColor: "bg-rose-600 text-white",
      checkColor: "text-rose-600",
      accentBorder: "hover:border-rose-400",
      image: "/images/landing/events.jpg",
      description:
        "Discover upcoming horse shows, breed championships, livestock fairs, auctions, and equestrian training camps across India.",
      highlights: ["Breed shows & competitions", "Livestock fairs & auction dates", "Training clinics & camps"],
    },
    {
      title: "Equine Jobs & Employment",
      tag: "Careers & Hiring",
      tagColor: "bg-indigo-600 text-white",
      checkColor: "text-indigo-600",
      accentBorder: "hover:border-indigo-400",
      image: "/images/landing/jobs.jpg",
      description:
        "A dedicated job board connecting stud farms, training stables, and equestrian clubs with qualified trainers, farriers, syces, and riders.",
      highlights: ["Hiring stable managers & trainers", "Grooms, farriers & rider vacancies", "Direct applications to farms"],
    },
  ]

  const profiles = [
    {
      title: "Horse Owners & Stud Farms",
      desc: "List horses for sale, arrange transport, and book doctors.",
      accent: "border-l-amber-500",
      badge: "🐴 Owners & Farms",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: "Veterinarians & Farriers",
      desc: "Get direct booking requests from stables and farms in your area.",
      accent: "border-l-blue-500",
      badge: "🩺 Doctors & Care",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "Equine Transporters",
      desc: "List your routes, fill empty trailer capacity, and increase trips.",
      accent: "border-l-emerald-500",
      badge: "🚚 Logistics",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "Tack & Feed Businesses",
      desc: "Sell equestrian accessories and nutrition to a focused audience.",
      accent: "border-l-purple-500",
      badge: "🛍️ Equipment",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    },
    {
      title: "Riding Schools & Trainers",
      desc: "Attract new riders and manage student training programs.",
      accent: "border-l-rose-500",
      badge: "🏇 Academies",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      title: "Riders & Job Seekers",
      desc: "Find horses, apply for equine jobs, and connect with India's network.",
      accent: "border-l-indigo-500",
      badge: "💼 Careers",
      badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-[#0F2238] antialiased">
      {/* Top Navigation — Crisp White Fixed Header */}
      <header className="sticky top-0 z-30 border-b border-[#E7DFD1] bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-2.5 sm:px-6">
          <Link to="/join" className="flex items-center gap-2 sm:gap-2.5 transition active:scale-98">
            <img
              src={displayLogo}
              alt={companyName || "Ashwa India"}
              className="h-8 w-auto object-contain sm:h-9"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <span className="text-base font-extrabold tracking-tight text-[#0F2238] whitespace-nowrap sm:text-lg">
              Ashwa <span className="text-[#C28D2E]">India</span>
            </span>
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C28D2E] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#a87722] active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span>Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Royal Hero Banner — Ultra-Compact & Balanced Layout */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#071324] via-[#0B1C33] to-[#0D2442] px-3.5 pt-4 pb-4 text-white sm:px-6 sm:pt-7 sm:pb-7">
        {/* Subtle Ambient Light Glows */}
        <div className="pointer-events-none absolute -top-16 right-1/4 h-64 w-64 rounded-full bg-[#C28D2E]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-52 w-52 rounded-full bg-[#1A4578]/35 blur-2xl" />

        {/* Right Side Visual Pillar — Royal Arch covering the full vertical height behind the horse */}
        <div className="pointer-events-none absolute right-1 top-2 bottom-0 z-0 flex flex-col items-center justify-end sm:right-6 md:right-10">
          {/* Full-height Royal Arch Frame */}
          <div className="absolute top-0 bottom-0 w-28 sm:w-40 rounded-t-3xl border-t border-x border-[#C28D2E]/35 bg-gradient-to-b from-[#C28D2E]/20 via-[#0F2847]/45 to-transparent backdrop-blur-2xs shadow-[0_0_25px_rgba(194,141,46,0.12)]">
            <div className="pt-2.5 text-center">
              <span className="text-[9px] font-extrabold tracking-widest text-[#E9BE65]/80 uppercase">✦ Ashwa ✦</span>
            </div>
          </div>

          {/* Horse Visual layered inside the arch */}
          <div className="relative z-10">
            <img
              src="/images/user/heroimage.png"
              alt="Ashwa India"
              className="h-[210px] w-auto object-contain object-bottom opacity-95 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] sm:h-[245px] md:h-[275px]"
            />
            {/* Seamless bottom fade into hero base */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0D2442] via-[#0D2442]/60 to-transparent" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="max-w-[65%] sm:max-w-lg pr-1 sm:pr-0">
            <div className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-[#C28D2E]/40 bg-[#C28D2E]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#E9BE65] backdrop-blur-xs">
              <Sparkles className="h-2.5 w-2.5 text-[#E9BE65]" />
              <span>India's Dedicated Equine Platform</span>
            </div>

            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-3xl sm:leading-tight">
              Everything for <span className="text-[#C28D2E]">Horses & Equestrians</span> in One Place
            </h1>

            <p className="mt-1 text-[11px] leading-relaxed text-neutral-300 sm:text-xs sm:leading-normal">
              Buy & sell verified horses, book trusted doctors and farriers, arrange inter-state shared transport,
              and explore shows across India.
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#C28D2E] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#a87722] active:scale-98 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <span>Register / Join Ashwa India</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Compact Stats Strip — Sits completely inside the left column, no horse overlap */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-300">
              <span className="rounded-md border border-amber-500/25 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-300">
                500+ Horses
              </span>
              <span className="rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                Shared Rides
              </span>
              <span className="rounded-md border border-blue-500/25 bg-blue-500/15 px-2 py-0.5 font-bold text-blue-300">
                Verified Care
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section — Compact Height, No Awkward Image Gaps */}
      <section id="services" className="border-t border-[#E7DFD1] bg-white px-3.5 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-center sm:mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C28D2E]">What Ashwa India Offers</p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#0F2238] sm:text-2xl">
              Core Services & Features
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-600 sm:text-xs">
              Designed for breeders, riders, equine professionals, and transport operators.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3.5">
            {services.map((item) => (
              <div
                key={item.title}
                className={`group flex flex-col overflow-hidden rounded-xl border border-[#E7DFD1] bg-[#FAF8F5] transition duration-200 ${item.accentBorder} hover:shadow-xs`}
              >
                {/* Visual Header — Full-bleed cinematic landscape photo */}
                <div className="relative h-30 w-full overflow-hidden bg-neutral-100 sm:h-36">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/30" />
                  <span
                    className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs ${item.tagColor}`}
                  >
                    {item.tag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                  <h3 className="text-sm font-bold text-[#0F2238] sm:text-base">{item.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 line-clamp-2">{item.description}</p>

                  <ul className="mt-2.5 space-y-1 border-t border-[#E7DFD1]/70 pt-2 text-[10px] sm:text-[11px] text-neutral-700">
                    {item.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-1.5">
                        <CheckCircle2 className={`h-3 w-3 shrink-0 ${item.checkColor}`} />
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

      {/* Who Can Join Section — Compact & Clean */}
      <section className="border-t border-[#E7DFD1] bg-[#FAF7F1] px-3.5 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-center sm:mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C28D2E]">Community & Roles</p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#0F2238] sm:text-2xl">
              Who Can Join Ashwa India?
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-600 sm:text-xs">
              Whether you own horses, provide care, seek equine jobs, or run an equine business.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div
                key={p.title}
                className={`rounded-xl border border-[#E7DFD1] border-l-4 ${p.accent} bg-white p-2.5 sm:p-3 shadow-2xs transition hover:border-[#C28D2E]`}
              >
                <div className="mb-1">
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#0F2238] sm:text-sm">{p.title}</h4>
                <p className="mt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-neutral-600">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Registration CTA Banner */}
          <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#071324] via-[#0B1C33] to-[#0D2442] p-3.5 text-white shadow-md sm:mt-6 sm:p-5">
            <div className="flex flex-col items-center justify-between gap-2.5 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-sm font-extrabold sm:text-base">
                  Ready to join <span className="text-[#C28D2E]">Ashwa India</span>?
                </h3>
                <p className="mt-0.5 text-[11px] text-neutral-300">
                  Register your stable, profile, or business in less than 2 minutes.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#C28D2E] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#a87722] active:scale-98 sm:text-sm sm:px-5 sm:py-2.5"
              >
                <span>Register Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7DFD1] bg-white px-4 pt-4 pb-16 text-center text-[10px] text-neutral-500 sm:px-6 sm:pb-6">
        <p className="font-semibold text-neutral-700">Ashwa India — India's Horse Community & Platform</p>
        <p className="mt-0.5 text-[10px]">AshwaIndia.com • All rights reserved</p>
        <div className="mt-2 flex justify-center gap-3 text-[11px] font-medium text-[#C28D2E]">
          <Link to="/register" className="hover:underline">Register</Link>
          <span>•</span>
          <Link to="/user/login" className="hover:underline">User Login</Link>
          <span>•</span>
          <Link to="/service/login" className="hover:underline">Provider Login</Link>
          <span>•</span>
          <Link to="/seller/login" className="hover:underline">Seller Login</Link>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar — Frosted Glass (Apple iOS Style) */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#E7DFD1] bg-white/85 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] sm:hidden">
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C28D2E] py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#a87722] active:scale-98"
        >
          <span>Register Now</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
