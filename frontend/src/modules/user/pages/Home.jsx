import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, CalendarDays, ChevronDown, ChevronRight, Heart, MapPin, Search, ShoppingBag, ShoppingCart, Users } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import { useWishlist } from "../context/WishlistContext"
import { useLocationContext } from "../context/LocationContext"

// Tile order, colours and destinations are fixed in the app; images and labels come from the admin Explore section.
const quickActions = [
  { key: "horses", label: "Horse\nMarketplace", image: "/user/horses-buy.png", bg: "#FBEFD6", path: "/user/horses" },
  { key: "providers", label: "Service\nProviders", image: "/user/service-providers.png", bg: "#E1ECFC", path: "/user/services" },
  { key: "transport", label: "Horse\nTransport", image: "/user/transport.png", bg: "#E0F4E7", path: "/user/transport" },
  { key: "store", label: "Accessories\nStore", image: "/user/accessories.png", bg: "#F0E4FB", path: "/user/store" },
  { key: "events", label: "Horse\nEvents", image: null, bg: "#FDE7E7", path: "/user/events" },
]

function HeroSection({ horsesCount, cartCount, wishlistCount }) {
  const navigate = useNavigate()
  const { location, status } = useLocationContext()
  const locationLabel = status === "loading" ? "Locating..." : location?.label || "Set Location"
  return (
    <div className="relative overflow-hidden bg-[#0B1C33] px-4 pb-6 pt-3">
      <img
        src="/user/heroimage.png"
        alt=""
        className="pointer-events-none absolute bottom-0 right-[-16px] h-[210px] w-[168px] object-contain"
      />

      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div className="mr-2 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="text-xl">🐎</span>
            <button className="flex items-center gap-1 text-left" onClick={() => navigate("/user/change-location")}>
              <MapPin className="h-[13px] w-[13px] text-[#C28D2E]" />
              <span className="truncate text-xs font-bold text-white">{locationLabel}</span>
              <ChevronDown className="h-[13px] w-[13px] text-[#A9B8CC]" />
            </button>
          </div>
          <p className="text-xl font-extrabold text-white">
            Ashwa<span className="text-[#C28D2E]">India</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/user/wishlist")} className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#132B4A]">
            <Heart className="h-[18px] w-[18px] text-white" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-[#0B1C33] bg-red-500 px-1 text-[9px] font-bold text-white">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate("/user/cart")} className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#132B4A]">
            <ShoppingCart className="h-[18px] w-[18px] text-white" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-[#0B1C33] bg-red-500 px-1 text-[9px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate("/user/notifications")} className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#132B4A]">
            <Bell className="h-[18px] w-[18px] text-white" />
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-[62%]">
        <p className="mb-1.5 text-[11px] font-bold tracking-widest text-[#C28D2E]">WELCOME TO ASHWAINDIA</p>
        <h1 className="text-[28px] font-extrabold leading-[34px] text-white">
          India's <span className="text-[#C28D2E]">Horse</span> Network
        </h1>
        <p className="mt-2 text-[13px] leading-[19px] text-[#A9B8CC]">
          Buy, sell, connect and grow with India's most trusted equine community.
        </p>
      </div>

      <button
        onClick={() => navigate("/user/horses")}
        className="relative z-10 mt-4 flex h-12 items-center gap-2 rounded-full bg-[#C28D2E] px-6 text-[15px] font-bold text-[#0B1C33]"
      >
        <Search className="h-4 w-4" />
        Browse Horses
        <ChevronRight className="h-[18px] w-[18px]" />
      </button>

      {horsesCount > 0 && (
        <div className="relative z-10 mt-2 flex items-center gap-1.5">
          <Users className="h-[13px] w-[13px] text-[#A9B8CC]" />
          <span className="text-xs text-[#A9B8CC]">{horsesCount}+ horses listed on Ashwa India</span>
        </div>
      )}
    </div>
  )
}

function BannerCarousel({ banners }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (banners.length < 2) return
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [banners.length])

  if (!banners.length) return null
  const banner = banners[activeIndex]

  return (
    <div className="mt-2 px-4">
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl bg-[#F1EEE6]">
        <img src={getMediaUrl(banner.image)} alt={banner.title || "Banner"} className="h-full w-full object-cover transition-opacity" />
        {banner.title && (
          <span className="absolute left-3 top-3 rounded-full bg-[#C28D2E] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">
            {banner.title.toUpperCase()}
          </span>
        )}
        {banner.subtitle && (
          <p className="absolute bottom-3.5 left-3.5 right-16 text-base font-extrabold leading-[21px] text-white">{banner.subtitle}</p>
        )}
        {banner.link && (
          <div className="absolute bottom-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/45">
            <ChevronRight className="h-[18px] w-[18px] text-white" />
          </div>
        )}
      </div>
      {banners.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {banners.map((b, i) => (
            <span
              key={b._id}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-[18px] bg-[#C28D2E]" : "w-1.5 bg-[#E4E1D8]"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function QuickActionsList() {
  const navigate = useNavigate()
  const [adminTiles, setAdminTiles] = useState({})

  useEffect(() => {
    apiFetch("/explore", { auth: false })
      .then((data) => {
        const byKey = {}
        for (const item of data.items || []) byKey[item.key] = item
        setAdminTiles(byKey)
      })
      .catch(() => setAdminTiles({}))
  }, [])

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-sm bg-[#C28D2E]" />
          <h2 className="text-base font-extrabold text-[#0F2238]">Explore Ashwa India</h2>
        </div>
        <span className="text-xs font-bold text-[#C28D2E]">View All →</span>
      </div>
      <div className="grid grid-cols-5 gap-1 px-3">
        {quickActions.map((fallback) => {
          const tile = adminTiles[fallback.key]
          if (tile && !tile.active) return null
          const image = tile?.image ? getMediaUrl(tile.image) : fallback.image
          const label = tile?.label ? tile.label.replace(/ /, "\n") : fallback.label
          return (
            <button
              key={fallback.key}
              disabled={!fallback.path}
              onClick={() => fallback.path && navigate(fallback.path)}
              className="flex min-w-0 flex-col items-center disabled:opacity-60"
            >
              <div className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: fallback.bg }}>
                {image ? (
                  <img src={image} alt={label.replace("\n", " ")} className="h-full w-full object-cover" />
                ) : (
                  <CalendarDays className="h-6 w-6 text-[#B5474A]" />
                )}
              </div>
              <span className="mt-1 whitespace-pre-line text-center text-xs font-semibold leading-[15px] text-[#0F2238]">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FeaturedHorses({ horses }) {
  const navigate = useNavigate()
  const { isSaved, toggle } = useWishlist()
  if (!horses.length) return null
  const NEW_WITHIN_MS = 7 * 24 * 60 * 60 * 1000

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-[17px] font-extrabold text-[#0F2238]">Featured Horses</h2>
        <button onClick={() => navigate("/user/horses")} className="text-xs font-bold text-[#C28D2E]">
          View All →
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1">
        {horses.slice(0, 8).map((horse) => {
          const isNew = Date.now() - new Date(horse.createdAt).getTime() < NEW_WITHIN_MS
          return (
            <button
              key={horse._id}
              onClick={() => navigate(`/user/horses/${horse._id}`)}
              className="w-[170px] shrink-0 overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pb-2 text-left"
            >
              <div className="relative h-[110px] w-full bg-[#F1EEE6]">
                {horse.photos?.[0] && <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="h-full w-full object-cover" />}
                <span className={`absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white ${isNew ? "bg-[#C28D2E]" : "bg-[#0B1C33]"}`}>
                  {isNew ? "NEW" : "FOR SALE"}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(horse)
                  }}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F2238]/55"
                >
                  <Heart className="h-3.5 w-3.5 text-white" fill={isSaved(horse._id) ? "white" : "transparent"} />
                </span>
              </div>
              <p className="mt-2 truncate px-2 text-[13px] font-bold text-[#0F2238]">
                {horse.breed}
                {horse.gender ? ` ${horse.gender.charAt(0).toUpperCase()}${horse.gender.slice(1)}` : ""}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-1 px-2">
                {horse.location ? (
                  <span className="flex items-center gap-1 truncate text-[11px] text-neutral-500">
                    <MapPin className="h-[11px] w-[11px] shrink-0" />
                    {horse.location}
                  </span>
                ) : (
                  <span />
                )}
                <span className="shrink-0 rounded-full bg-[#F6E9C9] px-2 py-[3px] text-xs font-extrabold text-[#8A6416]">
                  ₹{horse.price?.toLocaleString("en-IN")}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FeaturedProducts({ products }) {
  const navigate = useNavigate()
  if (!products.length) return null

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-[17px] font-extrabold text-[#0F2238]">Featured Products</h2>
        <button onClick={() => navigate("/user/store")} className="text-xs font-bold text-[#C28D2E]">
          View All →
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1">
        {products.slice(0, 8).map((product) => (
          <button
            key={product._id}
            onClick={() => navigate(`/user/store/${product._id}`)}
            className="w-[150px] shrink-0 overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pb-2 text-left"
          >
            <div className="flex h-[110px] w-full items-center justify-center bg-[#F1EEE6]">
              {product.photos?.[0] ? (
                <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag className="h-[22px] w-[22px] text-neutral-400" />
              )}
            </div>
            <p className="mt-2 line-clamp-2 px-2 text-[13px] font-bold leading-[17px] text-[#0F2238]">{product.name}</p>
            <p className="mt-1 px-2 text-sm font-extrabold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function SearchFilterCard({ categories, onSearch }) {
  const [categoryId, setCategoryId] = useState("")
  const [location, setLocation] = useState("")

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-[0_6px_14px_rgba(0,0,0,0.1)]">
      <p className="mb-1 mt-2 text-[11px] font-semibold text-neutral-500">I&apos;m looking for</p>
      <div className="flex h-11 items-center rounded-xl border border-[#E4E1D8] bg-[#F1EEE6] px-3">
        <span className="text-sm font-semibold text-[#0F2238]">Horses</span>
      </div>

      <p className="mb-1 mt-3 text-[11px] font-semibold text-neutral-500">Category</p>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="h-11 w-full rounded-xl border border-[#E4E1D8] px-3 text-sm text-[#0F2238]"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      <p className="mb-1 mt-3 text-[11px] font-semibold text-neutral-500">Location</p>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Any location"
        className="h-11 w-full rounded-xl border border-[#E4E1D8] px-3 text-sm text-[#0F2238] outline-none"
      />

      <button
        onClick={() => onSearch({ categoryId: categoryId || undefined, location: location.trim() || undefined })}
        className="mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B1C33] text-sm font-bold text-white"
      >
        <Search className="h-[17px] w-[17px]" />
        Search
      </button>
    </div>
  )
}

export default function UserHome() {
  const navigate = useNavigate()
  const { totalCount: cartCount } = useCart()
  const { horses: savedHorses } = useWishlist()
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [horses, setHorses] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    ;(async () => {
      const [bannersRes, categoriesRes, horsesRes, productsRes] = await Promise.allSettled([
        apiFetch("/banners", { auth: false }),
        apiFetch("/marketplace/categories"),
        apiFetch("/marketplace/horses"),
        apiFetch("/store/products"),
      ])
      if (bannersRes.status === "fulfilled") setBanners(bannersRes.value.banners || [])
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value.categories || [])
      if (horsesRes.status === "fulfilled") setHorses(horsesRes.value.horses || [])
      if (productsRes.status === "fulfilled") setProducts(productsRes.value.products || [])
    })()
  }, [])

  const handleSearch = ({ categoryId, location }) => {
    const params = new URLSearchParams()
    if (categoryId) params.set("category", categoryId)
    if (location) params.set("location", location)
    navigate(`/user/horses${params.toString() ? `?${params}` : ""}`)
  }

  return (
    <div className="pb-6">
      <HeroSection horsesCount={horses.length} cartCount={cartCount} wishlistCount={savedHorses.length} />
      <BannerCarousel banners={banners} />
      <QuickActionsList />
      <FeaturedHorses horses={horses} />
      <FeaturedProducts products={products} />
      <SearchFilterCard categories={categories} onSearch={handleSearch} />

      <div className="mx-4 mt-5 flex flex-col items-center rounded-2xl border border-[#E4E1D8] bg-white p-5 text-center">
        <p className="text-sm font-semibold text-[#0F2238]">No active bookings</p>
        <p className="mt-1 text-[13px] text-neutral-500">Browse services, transport or the marketplace to get started.</p>
      </div>
    </div>
  )
}
