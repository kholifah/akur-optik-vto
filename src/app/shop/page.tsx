
"use client"

import React, { Suspense, useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import ProductModal from "@/components/ProductModal"
import { products as allProducts, Product } from "@/lib/products"

const categoryValues = ["all", "eyeglasses", "sunglasses"] as const
type Category = (typeof categoryValues)[number]

const getCategoryFromParam = (value: string | null): Category => {
  if (value && (categoryValues as readonly string[]).includes(value)) {
    return value as Category
  }
  return "all"
}

function ShopPageContent() {
  const searchParams = useSearchParams()

  const initialCategory = getCategoryFromParam(searchParams.get("category"))

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc">("popular")
  const [selected, setSelected] = useState<Product | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // 🔄 Update category if URL changes
  useEffect(() => {
    if (searchParams.get("category")) {
      setCategory(getCategoryFromParam(searchParams.get("category")))
    }
  }, [searchParams])

  const products = useMemo(() => {
    let list = allProducts.slice()

    if (category !== "all") {
      list = list.filter((p) => p.category === category)
    }

    if (query.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price)
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price)

    return list
  }, [category, query, sort])

  function openModal(p: Product) {
    setSelected(p)
    setIsOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shop Glasses</h1>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="border rounded px-3 py-2"
          />

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "popular" | "price-asc" | "price-desc")
            }
            className="border rounded px-3 py-2"
          >
            <option value="popular">Sort: Popular</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        {categoryValues.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded ${
              category === c
                ? "bg-accent text-accent-foreground"
                : "bg-white border"
            }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onSelect={openModal}
            onTryVirtual={openModal}
          />
        ))}
      </div>

      {selected && (
        <ProductModal
          product={selected}
          isOpen={isOpen}
          startInVTO={false}
          onClose={() => setIsOpen(false)}
          onTryOn={() => {}}
        />
      )}
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <ShopPageContent />
    </Suspense>
  )
}
