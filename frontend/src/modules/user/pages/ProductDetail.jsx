import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { Button } from "@/shared/components/ui/button"
import { useCart } from "../context/CartContext"

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    apiFetch(`/store/products/${id}`)
      .then((data) => setProduct(data.product))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-neutral-500">Loading...</p>
  if (!product) return <p className="text-sm text-neutral-500">Product not found.</p>

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {(product.photos?.length ? product.photos : [null]).map((photo, idx) => (
            <div key={idx} className="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
              {photo && <img src={getMediaUrl(photo)} alt={product.name} className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#0F2238]">{product.name}</h1>
          <p className="text-sm text-neutral-500">{product.category?.name}</p>
          <p className="mt-3 text-3xl font-extrabold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.description && (
            <div className="mt-4">
              <p className="mb-1 text-sm font-bold text-[#0F2238]">Description</p>
              <p className="text-sm text-neutral-600">{product.description}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1"
              disabled={product.stock <= 0}
              onClick={() => {
                addItem(product)
                setAdded(true)
              }}
            >
              {added ? "Added ✓" : "Add to Cart"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/user/cart")}>
              Go to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
