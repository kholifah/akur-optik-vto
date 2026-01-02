/**
 * Product catalog grid component.
 *
 * Requirements:
 * - Display eyewear products in a clean grid
 * - Clicking a product opens a modal popup
 * - Minimal UI, image-first
 *
 * Data source:
 * - Local JSON product list
 */

"use client"

import React from "react"
import ProductModal from "./ProductModal"
import { products } from "@/lib/products"

export default function ProductGrid() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{products.map((p) => (
						<div key={p.id} className="">
							<ProductModal product={p} isOpen={false} onClose={() => {}} />
						</div>
					))}
		</div>
	)
}

