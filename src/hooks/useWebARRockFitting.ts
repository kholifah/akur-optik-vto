"use client"

import { useState, useCallback, useMemo } from "react"

export type TryOnCategory = "eyeglasses" | "sunglasses"

type FittingConfig = {
  modelUrl: string
  occluderUrl: string
  envMapUrl: string
  hasStarted: boolean
  startFitting: () => void
  stopFitting: () => void
}

/**
 * WebARRock fitting hook - manages AR session state
 * Camera initialization is handled by VTOGlassesAR component
 */
export const useWebARRockFitting = (category: TryOnCategory): FittingConfig => {
  const [hasStarted, setHasStarted] = useState(false)

  // Get model URLs based on category
  const { modelUrl, occluderUrl, envMapUrl } = useMemo(() => {
    const modelUrl =
      category === "sunglasses" ? "/models3D/sunglass.glb" : "/models3D/glasses1.glb"

    return {
      modelUrl,
      occluderUrl: "/models3D/occluder.glb",
      envMapUrl: "/envmaps/venice_sunset_1k.hdr",
    }
  }, [category])

  /**
   * Start AR session - triggered by user button click
   * VTOGlassesAR will handle camera permissions when active becomes true
   */
  const startFitting = useCallback(() => {
    console.log("[AR] Starting AR session...")
    setHasStarted(true)
  }, [])

  /**
   * Stop AR session and cleanup
   */
  const stopFitting = useCallback(() => {
    console.log("[AR] Stopping AR session...")
    setHasStarted(false)
  }, [])

  return {
    modelUrl,
    occluderUrl,
    envMapUrl,
    hasStarted,
    startFitting,
    stopFitting,
  }
}

export default useWebARRockFitting
