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
      description:
        "Browse verified listings of purebred horses — Marwari, Kathiawari, Thoroughbred, Arabian, and Warmblood. Review lineage, health documents, and contact sellers directly.",
      highlights: ["Direct seller inquiries", "Verified pedigree & health info", "Clean listing management"],
    },
    {
      title: "Horse Transport & Shared Rides",
      tag: "Logistics",
      image: "/images/user/transport.png",
      description:
        "Safe, stress-free equine transport across Indian states. Book dedicated horse floats and ambulances, or save up to 40% on travel costs by joining shared route runs.",
      highlights: ["Shared-ride cost savings", "Custom horse floats & ambulances", "Real-time trip coordination"],
    },
    {
      title: "Equine Professionals On-Demand",
      tag: "Healthcare & Care",
      image: "/images/user/service-providers.png",
      description:
        "Connect with experienced horse veterinarians, certified farriers, trainers, riding schools, and stable caretakers right at your location.",
      highlights: ["Doorstep vet & farrier visits", "Verified credentials & ratings", "Easy booking schedules"],
    },
    {
      title: "Equestrian Store & Tack",
      tag: "Gear & Feed",
      image: "/images/user/accessories.png",
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
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#E7DFD1] bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src={displayLogo}
              alt={companyName || "Ashwa India"}
              className="h-10 w-auto max-w-[130px] object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <span className="text-lg font-bold tracking-tight text-[#0F2238]">
              {companyName || "Ashwa India"}
            </span>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2238] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a385c] active:scale-95 sm:text-sm"
          >
            <span>Register</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-10 pb-12 sm:px-6 sm:pt-16 sm:pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D9CEBA] bg-[#F2EDE4] px-3 py-1 text-xs font-semibold text-[#7C5A1E]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>India's Dedicated Equine Platform</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2238] sm:text-5xl sm:leading-tight">
            Everything for Horses & Equestrians in One Place
          </h1>

          <p className="mt-4 text-base text-neutral-600 sm:text-lg sm:leading-relaxed">
            Ashwa India connects horse owners, breeders, veterinarians, farriers, transporters, and
            equestrian businesses on a single trusted, modern platform.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C28D2E] px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#a87722] active:scale-98 sm:w-auto"
            >
              <span>Register / Join Ashwa India</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#services"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D9CEBA] bg-white px-6 py-3.5 text-sm font-semibold text-[#0F2238] shadow-xs transition hover:bg-neutral-50 sm:w-auto"
            >
              <span>Explore Services</span>
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#C28D2E]" /> Verified Community
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#C28D2E]" /> Pan-India Network
            </span>
            <span className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-[#C28D2E]" /> Direct Bookings
            </span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="border-t border-[#E7DFD1] bg-white px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C28D2E]">What Ashwa India Offers</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F2238] sm:text-3xl">
              Comprehensive Services for the Horse Community
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              Designed from the ground up for breeders, riders, equine professionals, and transport operators.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {services.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7DFD1] bg-[#FAF8F5] transition duration-200 hover:border-[#C28D2E]/60 hover:shadow-md"
              >
                <div className="relative h-44 w-full overflow-hidden bg-neutral-100 sm:h-52">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 rounded-md bg-[#0F2238]/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
                    {item.tag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-[#0F2238]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.description}</p>

                  <ul className="mt-4 space-y-2 border-t border-[#E7DFD1]/60 pt-4 text-xs text-neutral-700">
                    {item.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
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

      {/* Who Can Join Section */}
      <section className="border-t border-[#E7DFD1] bg-[#FAF7F1] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C28D2E]">Community & Roles</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F2238] sm:text-3xl">
              Who Can Join Ashwa India?
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              Whether you own horses, provide specialized care, or run an equine business, there is a place for you.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-[#E7DFD1] bg-white p-5 shadow-2xs transition hover:border-[#C28D2E]"
              >
                <h4 className="font-bold text-[#0F2238]">{p.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Registration CTA Banner */}
          <div className="mt-12 overflow-hidden rounded-2xl bg-[#0F2238] p-6 text-white shadow-lg sm:p-10">
            <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">Ready to be part of Ashwa India?</h3>
                <p className="mt-1 text-sm text-neutral-300">
                  Register your stable, profile, or business in less than 2 minutes.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#C28D2E] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a87722] active:scale-98"
              >
                <span>Register Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7DFD1] bg-white px-4 py-8 text-center text-xs text-neutral-500 sm:px-6">
        <p className="font-semibold text-neutral-700">Ashwa India — India's Horse Community & Platform</p>
        <p className="mt-1">AshwaIndia.com • All rights reserved</p>
        <div className="mt-3 flex justify-center gap-4 text-xs font-medium text-[#C28D2E]">
          <Link to="/register" className="hover:underline">Register</Link>
          <span>•</span>
          <Link to="/user/login" className="hover:underline">User Login</Link>
          <span>•</span>
          <Link to="/service/login" className="hover:underline">Provider Login</Link>
          <span>•</span>
          <Link to="/seller/login" className="hover:underline">Seller Login</Link>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#E7DFD1] bg-[#FAF7F1]/95 p-3 backdrop-blur-md sm:hidden">
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2238] py-3 text-sm font-semibold text-white shadow-md active:scale-98"
        >
          <span>Register / Join Ashwa India</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
