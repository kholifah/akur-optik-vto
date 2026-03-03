import React from "react"
import { notFound } from "next/navigation"
import { getProductById } from "@/lib/products"
import ProductDetail from "@/components/ProductDetail"

type Params = { id: string }
type PageProps = { params: Promise<Params> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const product = getProductById(id)
  if (!product) return notFound()

  return <ProductDetail product={product} />
}
