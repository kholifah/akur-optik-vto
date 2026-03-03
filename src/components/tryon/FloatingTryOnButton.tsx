"use client"

import React, { useCallback, useState } from "react"
import { ScanFace } from "lucide-react"
import { TryOnCategoryModal } from "@/components/tryon/TryOnCategoryModal"
import { TryOnARModal } from "@/components/tryon/TryOnARModal"
import type { TryOnCategory } from "@/hooks/useWebARRockFitting"

export const FloatingTryOnButton = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isArOpen, setIsArOpen] = useState(false)
  const [category, setCategory] = useState<TryOnCategory | null>(null)

  const handleSelectCategory = useCallback((nextCategory: TryOnCategory) => {
    setCategory(nextCategory)
    setIsCategoryOpen(false)
    setIsArOpen(true)
  }, [])

  return (
    <>
      <button
        type="button"
        aria-label="Quick try-on"
        onClick={() => setIsCategoryOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-semibold shadow-xl transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ScanFace className="h-5 w-5" />
        <span>Quick Try-On</span>
      </button>

      <TryOnCategoryModal
        open={isCategoryOpen}
        onOpenChange={setIsCategoryOpen}
        onSelect={handleSelectCategory}
      />

      <TryOnARModal
        open={isArOpen}
        onOpenChange={setIsArOpen}
        category={category}
      />
    </>
  )
}

export default FloatingTryOnButton
