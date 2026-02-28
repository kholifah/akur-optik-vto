"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { TryOnCategory } from "@/hooks/useWebARRockFitting"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (category: TryOnCategory) => void
}

export const TryOnCategoryModal = ({ open, onOpenChange, onSelect }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Trying something fresh?</DialogTitle>
          <DialogDescription>
            Try it on — pick eyeglasses or sunglasses
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("eyeglasses")}
            className="group rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-sm uppercase text-muted-foreground">Category</div>
            <div className="mt-2 text-lg font-semibold">Eyeglasses</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Everyday classics with clean, modern lines.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelect("sunglasses")}
            className="group rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-sm uppercase text-muted-foreground">Category</div>
            <div className="mt-2 text-lg font-semibold">Sunglasses</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Bold frames designed for sun and style.
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TryOnCategoryModal
