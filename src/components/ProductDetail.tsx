"use client"

import React, { useState } from "react"
import Image from "next/image"
import type { Product } from "@/lib/products"
import ProductModal from "@/components/ProductModal"
import { useAppDispatch, addToCart } from "@/store"

type Props = {
  product: Product
}

export default function ProductDetail({ product }: Props) {
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()

  const rating = 4.8
  const reviews = 7

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/2 p-6 flex items-center justify-center">
            <div className="w-full h-96 relative bg-gray-50 flex items-center justify-center">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>

          {/* Info */}
          <div className="md:w-1/2 p-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.287 3.965c.3.922-.755 1.688-1.54 1.118L10 13.347l-3.378 2.455c-.785.57-1.84-.196-1.54-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.627 9.393c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.966z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {rating.toFixed(1)} ({reviews})
              </div>
            </div>

            {/* Price */}
            <div className="mt-4 text-2xl font-semibold">
              Rp {product.price.toLocaleString()}
            </div>

            {/* Description */}
            <p className="mt-4 text-muted-foreground">
              {product.description}
            </p>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(true)}
                className="flex-1 bg-accent text-accent-foreground px-6 py-3 rounded"
              >
                Try Virtually
              </button>

              <button
                onClick={() => dispatch(addToCart(product, 1))}
                className="flex-1 border px-6 py-3 rounded"
              >
                Add to Cart
              </button>
            </div>

            {/* Specs */}
            <div className="mt-6 text-sm text-muted-foreground space-y-1">
              <div>
                <strong>Color:</strong> {product.color}
              </div>
              <div>
                <strong>Material:</strong> {product.material}
              </div>
              <div>
                <strong>Frame width:</strong> {product.frameWidth} mm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Try-On Modal */}
      <ProductModal
        product={product}
        isOpen={open}
        startInVTO={true}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
