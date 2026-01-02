"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/products"

export type Props = {
  product: Product
  onSelect?: (p: Product) => void
  onTryVirtual?: (p: Product) => void
}

export function ProductCard({ product, onSelect, onTryVirtual }: Props) {
  const router = useRouter()

  function handleCardClick() {
    if (onSelect) return onSelect(product)
    router.push(`/product/${product.id}`)
  }

  return (
    <div className="rounded-lg overflow-hidden bg-white shadow-sm transition-transform duration-300 ease-out hover:-translate-y-2 hover:scale-105 hover:shadow-lg">
      <div className="w-full text-left">
        <button onClick={handleCardClick} className="w-full text-left">
          <div className="w-full h-56 bg-white p-6 flex items-center justify-center">
            <Image src={product.image} alt={product.name} width={360} height={220} className="object-contain transition-opacity duration-300" />
          </div>
          <div className="p-4">
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">Rp {product.price.toLocaleString()}</div>
          </div>
        </button>

        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={() => onTryVirtual?.(product)}
            className="flex-1 text-sm px-3 py-2 border rounded bg-white hover:bg-gray-50"
          >
            Try Virtually
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard

