"use client"

import React, { useEffect } from "react"
import dynamic from "next/dynamic"
import { X, ScanFace } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { useWebARRockFitting, type TryOnCategory } from "@/hooks/useWebARRockFitting"

const VTOGlassesAR = dynamic(() => import("@/components/VTOGlassesAR"), { ssr: false })

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: TryOnCategory | null
}

export const TryOnARModal = ({ open, onOpenChange, category }: Props) => {
  const { modelUrl, occluderUrl, envMapUrl, hasStarted, startFitting, stopFitting } =
    useWebARRockFitting(category ?? "eyeglasses")

  const handleClose = () => {
    stopFitting()
    onOpenChange(false)
  }

  // Handle ESC key
  useEffect(() => {
    if (!open) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Cleanup on modal close
  useEffect(() => {
    if (!open) {
      stopFitting()
    }
  }, [open, stopFitting])

  const handleStartAR = () => {
    startFitting()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl rounded-2xl p-0" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>
            {category === "sunglasses" ? "Try On Sunglasses" : "Try On Eyeglasses"}
          </DialogTitle>
        </VisuallyHidden>
        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl bg-black">
          {/* Close button */}
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-black shadow-lg transition hover:bg-white"
          >
            <X className="h-4 w-4" />
            Close
          </button>

          {/* Category badge */}
          <div className="absolute left-5 top-4 z-30 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {category === "sunglasses" ? "Sunglasses" : "Eyeglasses"}
          </div>

          {/* VTOGlassesAR handles all camera initialization and UI */}
          {hasStarted && (
            <VTOGlassesAR
              modelUrl={modelUrl}
              occluderUrl={occluderUrl}
              envMapUrl={envMapUrl}
              active={hasStarted}
              autoStartCamera={true}
              cameraAspectRatio={9 / 16}
              fillWidthInContainer={true}
            />
          )}

          {/* Start AR Button - shown before AR starts */}
          {!hasStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full bg-white/10 p-6 backdrop-blur-sm">
                    <ScanFace className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">Ready to Try On?</h3>
                <p className="mb-6 text-sm text-white/80">
                  Click below to start the virtual try-on experience
                </p>
                <button
                  type="button"
                  onClick={handleStartAR}
                  className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
                >
                  Start AR Try-On
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TryOnARModal
