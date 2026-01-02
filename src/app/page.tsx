/**
 * Landing page inspired by Saturdays.com
 *
 * Layout:
 * - Large hero headline
 * - Minimal text
 * - White background
 * - Generous spacing
 *
 * Sections:
 * - Hero
 * - Product catalog grid
 *
 * Style:
 * - Editorial
 * - Premium
 * - Optical brand
 */
"use client";
/**
 * Home Page - Landing & Product Catalog
 */

import { useCallback, useState } from 'react';
import Image from "next/image"
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { Product, getProductsByCategory } from '@/lib/products';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { useAppDispatch, useAppState, openModal, closeModal } from '@/store';
import Hero from "@/components/Hero";

export default function Home() {
	const router = useRouter()
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [startInVTO, setStartInVTO] = useState(false)
	const dispatch = useAppDispatch()

	const eyeglasses = getProductsByCategory('eyeglasses')
	const sunglasses = getProductsByCategory('sunglasses')

	const handleProductSelect = useCallback((product: Product) => {
		setSelectedProduct(product)
		setStartInVTO(false)
		setIsModalOpen(true)
	}, [])

	const handleTryVirtual = useCallback((product: Product) => {
		setSelectedProduct(product)
		setStartInVTO(true)
		setIsModalOpen(true)
	}, [])

	const handleTryOn = useCallback((product: Product) => {
		setIsModalOpen(false)
		router.push(`/try-on?product=${product.id}`)
	}, [router])

	return (
		<div className="min-h-screen bg-background">

      <Hero />
      
			<section id="eyeglasses" className="border-b border-border py-20 md:py-32">
				<div className="container space-y-12">
					<div className="space-y-2">
						<p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Collection</p>
						<h2 className="font-serif text-4xl md:text-5xl font-bold">Eyeglasses</h2>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{eyeglasses.map((product) => (
							<ProductCard key={product.id} product={product} onSelect={handleProductSelect} onTryVirtual={handleTryVirtual} />
						))}
					</div>
				</div>
			</section>

			<section id="sunglasses" className="border-b border-border py-20 md:py-32">
				<div className="container space-y-12">
					<div className="space-y-2">
						<p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Collection</p>
						<h2 className="font-serif text-4xl md:text-5xl font-bold">Sunglasses</h2>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{sunglasses.map((product) => (
							<ProductCard key={product.id} product={product} onSelect={handleProductSelect} onTryVirtual={handleTryVirtual} />
						))}
					</div>
				</div>
			</section>

			<section className="py-20 md:py-32 bg-secondary">
				<div className="container text-center space-y-8">
					<div className="space-y-4">
						<p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Virtual Try-On</p>
						<h2 className="font-serif text-4xl md:text-5xl font-bold">See How You Look</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">Use our advanced AR technology to virtually try on any frame. See exactly how each style suits your face before making a purchase decision.</p>
					</div>
					<Button onClick={() => router.push('/try-on')} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 py-3">Start Virtual Try-On</Button>
				</div>
			</section>

			{/* Footer moved to shared component in layout */}

			<ProductModal product={selectedProduct} isOpen={isModalOpen} startInVTO={startInVTO} onClose={() => setIsModalOpen(false)} onTryOn={handleTryOn} />
		</div>
	);
}
