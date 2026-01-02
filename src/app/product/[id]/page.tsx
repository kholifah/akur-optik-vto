import React from "react"
import { notFound } from "next/navigation"
import { getProductById } from "@/lib/products"
import ProductDetail from "@/components/ProductDetail"

type Params = { id: string }

export default function Page({ params }: { params: Params }) {
  const id = params.id
  const product = getProductById(id)
  if (!product) return notFound()

  return <ProductDetail product={product} />
}
