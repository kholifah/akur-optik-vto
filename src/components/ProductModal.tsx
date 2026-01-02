"use client"

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Product, products as allProducts } from '@/lib/products';
import { useAppDispatch, addToCart } from '@/store'
import VTOCanvas from '@/components/VTOCanvas';

type Props = {
	product: Product | null;
	isOpen: boolean;
	startInVTO?: boolean;
	onClose: () => void;
	onTryOn?: (p: Product) => void;
};

declare global {
	interface Window {
		WEBARROCKSFACE?: Record<string, unknown>;
	}
}

export function ProductModal({ product, isOpen, startInVTO = false, onClose, onTryOn }: Props) {
	const [view, setView] = useState<'details' | 'virtual'>(startInVTO ? 'virtual' : 'details')
	const [virtualTab, setVirtualTab] = useState<'ar' | '3d'>('ar')
	const [selectedId, setSelectedId] = useState<string | null>(product?.id ?? null)
	const dispatch = useAppDispatch()

	useEffect(() => {
		if (startInVTO) {
			setView('virtual')
			setVirtualTab('ar')
		} else {
			setView('details')
			setVirtualTab('ar')
		}
		setSelectedId(product?.id ?? null)
	}, [startInVTO, product])

	useEffect(() => {
		if (view !== 'virtual') return
		// Load model-viewer for 3D preview
		const src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
		if (!document.querySelector(`script[src="${src}"]`)) {
			const s = document.createElement('script')
			s.type = 'module'
			s.src = src
			document.head.appendChild(s)
		}

		// Load WebAR.rocks.face library for AR face detection
		const arSrc = 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@master/dist/webar.rocks.face.min.js'
		if (!document.querySelector(`script[src="${arSrc}"]`)) {
			const s2 = document.createElement('script')
			s2.src = arSrc
			s2.async = true
			s2.onload = () => {
				// Library loaded; initialization will happen when AR tab is selected
			}
			s2.onerror = () => {
				console.warn('WebAR.rocks.face failed to load')
			}
			document.head.appendChild(s2)
		}
	}, [view])

	if (!isOpen || !product) return null;

	function close() {
		setView('details')
		onClose()
	}

	// Prefer product-specific model if available
	// variants with same product name (e.g., color variants)
	const variants = allProducts.filter((p) => p.name === product.name)
	const currentProduct = variants.find((v) => v.id === selectedId) ?? product
	const modelUrl = currentProduct.modelUrl ?? `/models3D/glasses1.glb`
	const modelOffset = currentProduct.modelOffset ?? { x: 0, y: 0, z: 0, scale: 1, rotation: 0 }

	const rating = 4.8
	const reviews = 7

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50" onClick={close} />
			<div className="bg-background rounded-lg shadow-lg max-w-4xl w-full z-10 overflow-hidden">
				<div className="flex flex-col md:flex-row">
					<div className="md:w-2/3 p-4">
						{/* Top controls */}
						<div className="flex justify-between items-start mb-2">
							<div className="text-sm text-muted-foreground">{product.category?.toUpperCase?.()}</div>
							<button onClick={close} className="text-xl font-bold">✕</button>
						</div>

						{/* Large VTO area */}
						<div className="relative h-[420px] bg-black/5 rounded-lg overflow-hidden">
							{view === 'virtual' ? (
								virtualTab === 'ar' ? (
									<VTOCanvas imageSrc={currentProduct.image} alt={currentProduct.name} frameWidthMm={currentProduct.frameWidth} modelUrl={modelUrl} modelOffset={modelOffset} />
								) : (
									React.createElement('model-viewer', {
										src: modelUrl,
										alt: currentProduct.name,
										'auto-rotate': true,
										'camera-controls': true,
										'shadow-intensity': '1',
										exposure: '1',
										style: { width: '100%', height: '100%' },
										'aria-label': `3D model of ${currentProduct.name}`,
									})
								)
							) : (
								<div className="w-full h-full flex items-center justify-center bg-gray-50">
									{product.image ? (
										<Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain" />
									) : null}
								</div>
							)}

							{/* variants thumbnails row */}
							<div className="absolute left-1/2 transform -translate-x-1/2 bottom-4 w-[92%] flex items-center gap-3 justify-center">
								<div className="bg-white rounded-lg px-3 py-2 flex gap-3 overflow-x-auto">
									{variants.map((v) => (
										<button key={v.id} onClick={() => setSelectedId(v.id)} className={`w-20 h-12 p-1 rounded ${v.id === currentProduct.id ? 'ring-2 ring-accent' : 'ring-0'}`}>
											<Image src={v.image} alt={v.name} width={80} height={48} className="object-contain" />
										</button>
									))}
								</div>
							</div>
						</div>

						{/* AR / 3D tabs */}
						<div className="mt-3 flex gap-2">
							<button className={`px-3 py-1 rounded ${virtualTab === 'ar' ? 'bg-accent text-accent-foreground' : 'bg-white border'}`} onClick={() => setVirtualTab('ar')}>AR</button>
							<button className={`px-3 py-1 rounded ${virtualTab === '3d' ? 'bg-accent text-accent-foreground' : 'bg-white border'}`} onClick={() => setVirtualTab('3d')}>3D</button>
						</div>
					</div>

					<div className="md:w-1/3 p-6 flex flex-col justify-between">
						<div>
							<h3 className="text-2xl font-bold">{currentProduct.name}</h3>
							<div className="text-sm text-muted-foreground mt-1">{currentProduct.color} · {currentProduct.material}</div>
							<div className="mt-3 flex items-center gap-3">
								<div className="flex items-center gap-1 text-yellow-500">
									{Array.from({ length: 5 }).map((_, i) => (
										<svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.287 3.965c.3.922-.755 1.688-1.54 1.118L10 13.347l-3.378 2.455c-.785.57-1.84-.196-1.54-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.627 9.393c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.966z" />
										</svg>
									))}
								</div>
								<div className="text-sm text-muted-foreground">{rating.toFixed(1)} ({reviews})</div>
							</div>

							<div className="mt-4 text-2xl font-semibold">Rp {currentProduct.price.toLocaleString()}</div>

							<p className="mt-4 text-sm text-muted-foreground">{currentProduct.description}</p>
						</div>

						<div className="mt-6 flex gap-3">
							<button className="flex-1 border px-4 py-2 rounded" onClick={() => window.location.href = `/product/${currentProduct.id}`}>SEE DETAILS</button>
							<button className="flex-1 bg-accent text-accent-foreground px-4 py-2 rounded" onClick={() => { dispatch(addToCart(currentProduct, 1)); onTryOn?.(currentProduct) }}>ADD TO CART</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ProductModal;
