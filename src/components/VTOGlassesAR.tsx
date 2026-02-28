"use client"

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { Box3, Vector3, Object3D } from "three"

import NN from "@/contrib/WebARRocksFace/neuralNets/NN_GLASSES_6.json"
import mirrorHelper from "@/contrib/WebARRocksFace/helpers/WebARRocksMirror.js"

type Props = {
  modelUrl?: string
  occluderUrl?: string
  envMapUrl?: string
  cameraOnly?: boolean
  autoFitModel?: boolean
  active?: boolean
}

type VideoSettingsOverride = MediaTrackConstraints | true

type InitFlag = { value: boolean }
type WebARRocksWindow = Window & { __WEBARROCKS_INIT_FLAG?: InitFlag }

const getErrorName = (err: unknown): string | null => {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name?: unknown }).name
    return typeof name === "string" ? name : null
  }
  return null
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  return fallback
}
let _initInFlight: Promise<void> | null = null
let _destroyInFlight: Promise<void> | null = null
const getInitFlag = () => {
  if (typeof window === "undefined") return { value: false }
  const w = window as WebARRocksWindow
  if (!w.__WEBARROCKS_INIT_FLAG) w.__WEBARROCKS_INIT_FLAG = { value: false }
  return w.__WEBARROCKS_INIT_FLAG
}

const ThreeGrabber = (props: { sizing: Sizing; lighting: LightingSpec }) => {
  const threeFiber = useThree()

  useFrame(mirrorHelper.update.bind(null, props.sizing, threeFiber.camera))
  mirrorHelper.set_lighting(threeFiber.gl, threeFiber.scene, props.lighting)

  return null
}

type Sizing = { width: number; height: number; top: number; left: number }

type LightingSpec = {
  envMap: string
  pointLightIntensity: number
  pointLightY: number
  hemiLightIntensity: number
}

const computeSizing = (): Sizing => {
  const height = window.innerHeight
  const wWidth = window.innerWidth
  const width = Math.min(wWidth, height)
  const top = 0
  const left = (wWidth - width) / 2
  return { width, height, top, left }
}
// ...existing code...

const VTOModelContainer = (props: {
  GLTFModel: string
  GLTFOccluderModel: string
  onModelError?: (message: string | null) => void
}) => {
  const {
    GLTFModel,
    GLTFOccluderModel,
    onModelError,
  } = props
  const [modelScene, setModelScene] = useState<Object3D | null>(null)
  const [occluderMesh, setOccluderMesh] = useState<Object3D | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [occluderLoaded, setOccluderLoaded] = useState(false)
  const objRef = useRef<Object3D | null>(null)

  useEffect(() => {
    let cancelled = false
    setModelScene(null)
    setOccluderMesh(null)
    setModelLoaded(false)
    setOccluderLoaded(false)
    onModelError?.(null)

    const loader = new GLTFLoader()
    loader.load(
      GLTFModel,
      (gltf) => {
        if (cancelled) return
        const scene = (gltf.scene || gltf.scenes?.[0])?.clone?.() ?? null
        if (!scene) {
          onModelError?.("Model 3D kosong atau tidak valid.")
          return
        }
        setModelScene(scene)
        setModelLoaded(true)
      },
      undefined,
      () => {
        if (cancelled) return
        onModelError?.("Gagal memuat model 3D. Periksa file GLB.")
      }
    )

    const loaderOccluder = new GLTFLoader()
    loaderOccluder.load(
      GLTFOccluderModel,
      (gltf) => {
        if (cancelled) return
        const occluderScene = (gltf.scene || gltf.scenes?.[0])?.clone?.() ?? null
        if (!occluderScene) {
          onModelError?.("Occluder 3D kosong atau tidak valid.")
          return
        }
        const isDebugOccluder = false
        const mesh = mirrorHelper.create_occluderMesh(occluderScene, isDebugOccluder)
        setOccluderMesh(mesh)
        setOccluderLoaded(true)
      },
      undefined,
      () => {
        if (cancelled) return
        onModelError?.("Gagal memuat occluder 3D. Periksa file GLB.")
      }
    )

    return () => {
      cancelled = true
    }
  }, [GLTFModel, GLTFOccluderModel, onModelError])

  useEffect(() => {
    if (modelLoaded && occluderLoaded) onModelError?.(null)
  }, [modelLoaded, occluderLoaded, onModelError])

  if (!modelScene || !occluderMesh) return null

  return (
    <object3D ref={objRef}>
      <object3D>
        <primitive object={modelScene} />
        <primitive object={occluderMesh} />
      </object3D>
    </object3D>
  )
}

type GlassesBranchSpec = {
  fadingZ: number
  fadingTransition: number
  bendingAngle: number
  bendingZ: number
}

const DebugCube = (props: { size?: number }) => {
  const s = props.size || 1
  return (
    <mesh name="debugCube">
      <boxGeometry args={[s, s, s]} />
      <meshNormalMaterial />
    </mesh>
  )
}

export default function VTOGlassesAR({
  modelUrl = "/models3D/glasses1.glb",
  occluderUrl = "/models3D/occluder.glb",
  envMapUrl = "/envmaps/venice_sunset_1k.hdr",
  cameraOnly = false,
  autoFitModel,
  active = true,
}: Props) {
  const shouldAutoFitModel = autoFitModel ?? modelUrl.includes("sunglass")
  const [sizing, setSizing] = useState<Sizing>(() =>
    typeof window !== "undefined" ? computeSizing() : { width: 640, height: 480, top: 0, left: 0 }
  )
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [modelError, setModelError] = useState<string | null>(null)
  const [isMirrorReady, setIsMirrorReady] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string | null>(null)

  const canvasFaceRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const autoInitRef = useRef(false)

  const _settings = {
    glassesBranches: {
      fadingZ: -0.9,
      fadingTransition: 0.6,
      bendingAngle: 5,
      bendingZ: 0,
    } satisfies GlassesBranchSpec,

    lighting: {
      envMap: envMapUrl,
      pointLightIntensity: 0.6,
      pointLightY: 200,
      hemiLightIntensity: 0,
    } satisfies LightingSpec,

    GLTFOccluderModel: occluderUrl,

    bloom: {
      threshold: 0.6,
      intensity: 5,
      kernelSizeLevel: 0,
      computeScale: 0.4,
      luminanceSmoothing: 0.5,
    },
  }

  const isSecure = typeof window !== "undefined" && window.isSecureContext

  const getContainerSizing = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect?.width && rect?.height) {
      return { width: rect.width, height: rect.height, top: 0, left: 0 }
    }
    return computeSizing()
  }, [])

  const updateSizingFromContainer = useCallback(() => {
    const newSizing = getContainerSizing()
    setSizing(newSizing)
    mirrorHelper.resize()
  }, [getContainerSizing])

  const listenersCleanupRef = useRef<null | (() => void)>(null)

  const attachListeners = useCallback(() => {
    const ro = window.ResizeObserver
      ? new ResizeObserver(() => {
          updateSizingFromContainer()
        })
      : null
    if (ro && containerRef.current) ro.observe(containerRef.current)
    const handleResize = () => updateSizingFromContainer()
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    listenersCleanupRef.current = () => {
      if (ro && containerRef.current) ro.unobserve(containerRef.current)
      if (ro) ro.disconnect()
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [updateSizingFromContainer])

  const detachListeners = useCallback(() => {
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current()
      listenersCleanupRef.current = null
    }
  }, [])

  const stopVideoStream = useCallback(() => {
    try {
      const prev = videoRef.current?.srcObject as MediaStream | null
      prev?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    } catch {
      // ignore
    }
  }, [])

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      const cams = list.filter((d) => d.kind === "videoinput")
      setDevices(cams)
      let nextDeviceId: string | null = null
      if (cams.length > 0) {
        nextDeviceId = deviceId && cams.some((d) => d.deviceId === deviceId)
          ? deviceId
          : cams[0].deviceId
      }
      if (nextDeviceId !== deviceId) setDeviceId(nextDeviceId)
      return nextDeviceId
    } catch {
      // ignore
      return deviceId ?? null
    }
  }, [deviceId])

  const startVideoStream = async () => {
    console.log("[startVideoStream] 🎬 Starting video stream...")
    
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.error("[startVideoStream] ❌ getUserMedia not supported")
      setCameraError("Browser tidak mendukung kamera (getUserMedia).")
      throw new Error("Browser tidak mendukung kamera (getUserMedia).")
    }
    
    console.log("[startVideoStream] 🛑 Stopping existing stream if any...")
    stopVideoStream()

    console.log("[startVideoStream] 🔄 Refreshing devices...")
    const preferredDeviceId = await refreshDevices()
    console.log("[startVideoStream] 📱 Preferred device ID:", preferredDeviceId)

    const primaryConstraints: MediaStreamConstraints = {
      video: preferredDeviceId
        ? { deviceId: { exact: preferredDeviceId } }
        : { facingMode: "user" },
    }
    console.log("[startVideoStream] 📋 Constraints:", primaryConstraints)

    let stream: MediaStream
    try {
      console.log("[startVideoStream] 📸 Requesting getUserMedia...")
      stream = await navigator.mediaDevices.getUserMedia(primaryConstraints)
      console.log("[startVideoStream] ✅ Stream obtained, tracks:", stream.getTracks().length)
    } catch (err: unknown) {
      const name = getErrorName(err)
      console.warn("[startVideoStream] ⚠️ Primary request failed with:", name)
      
      if (name === "NotReadableError" || name === "OverconstrainedError") {
        console.log("[startVideoStream] 🔄 Retrying with fallback constraints...")
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        console.log("[startVideoStream] ✅ Fallback stream obtained")
      } else {
        console.error("[startVideoStream] ❌ Failed to get stream:", err)
        throw err
      }
    }

    if (!videoRef.current) {
      console.error("[startVideoStream] ❌ Video element not ready!")
      throw new Error("Video belum siap. Coba lagi.")
    }
    
    console.log("[startVideoStream] 📺 Attaching stream to video element...")
    videoRef.current.srcObject = stream
    
    console.log("[startVideoStream] ▶️ Starting video playback...")
    await videoRef.current.play().catch((e) => {
      console.warn("[startVideoStream] ⚠️ Video play() failed:", e)
    })

    // wait for video to have dimensions
    console.log("[startVideoStream] ⏳ Waiting for video dimensions...")
    await new Promise<void>((resolve, reject) => {
      const t0 = Date.now()
      const tick = () => {
        const v = videoRef.current
        if (v && v.videoWidth > 0 && v.videoHeight > 0) {
          console.log(`[startVideoStream] ✅ Video ready: ${v.videoWidth}x${v.videoHeight}`)
          return resolve()
        }
        if (Date.now() - t0 > 3000) {
          console.error("[startVideoStream] ❌ Video dimensions timeout")
          return reject(new Error("Video belum siap."))
        }
        requestAnimationFrame(tick)
      }
      tick()
    })

    console.log("[startVideoStream] ✅ Video stream started successfully")
    setCameraError(null)
  }

  const isInitializedRef = useRef(false)
  const ensureDestroyed = useCallback(async () => {
    isInitializedRef.current = false;
    if (!_destroyInFlight) {
      _destroyInFlight = mirrorHelper
        .destroy()
        .catch((err: unknown) => {
          if (err === "ALREADY_DESTROYING") return
        })
        .finally(() => {
          _destroyInFlight = null
        })
    }
    return _destroyInFlight
  }, [])

  const initMirror = useCallback(async (videoSettingsOverride?: VideoSettingsOverride): Promise<void> => {
    if (isInitializedRef.current) {
      console.warn("[initMirror] 🚫 Already initialized, skipping.")
      return
    }
    console.log("[initMirror] 🎬 Starting WebARRock initialization...")
    const initFlag = getInitFlag()
    console.log("[initMirror] 🏁 Init flag value:", initFlag.value)
    if (initFlag.value) {
      console.warn("[initMirror] ⚠️ Already initializing or initialized (flag)")
      return _initInFlight ?? Promise.reject(new Error("Inisialisasi kamera sedang berjalan."))
    }
    if (_initInFlight) {
      console.log("[initMirror] ⏳ Init already in flight, returning existing promise")
      return _initInFlight
    }
    initFlag.value = true
    isInitializedRef.current = true
    detachListeners()
    if (!canvasFaceRef.current) {
      console.error("[initMirror] ❌ Canvas not ready!")
      initFlag.value = false
      isInitializedRef.current = false
      return Promise.reject(new Error("Canvas belum siap. Coba lagi."))
    }
    
    console.log("[initMirror] ✅ Canvas ready")
    console.log("[initMirror] 📷 Device ID:", deviceId)
    console.log("[initMirror] 📷 Available devices:", devices.length)
    
    const resolvedDeviceId = deviceId && devices.some((d) => d.deviceId === deviceId)
      ? deviceId
      : null
    const resolvedVideoSettings =
      videoSettingsOverride ?? (resolvedDeviceId ? { deviceId: { exact: resolvedDeviceId } } : undefined)
    
    console.log("[initMirror] 🎥 Video settings:", resolvedVideoSettings)
    
    _initInFlight = mirrorHelper
      .init({
        NN,
        ...(resolvedVideoSettings ? { videoSettings: resolvedVideoSettings } : {}),
        scanSettings: { threshold: 0.8 },
        landmarksStabilizerSpec: {
          beta: 10,
          minCutOff: 0.001,
          freqRange: [2, 144],
          forceFilterNNInputPxRange: [2.5, 6],
        },
        solvePnPImgPointsLabels: [
          "leftEarBottom",
          "rightEarBottom",
          "noseBottom",
          "noseLeft",
          "noseRight",
          "leftEyeExt",
          "rightEyeExt",
        ],
        canvasFace: canvasFaceRef.current,
        maxFacesDetected: 1,
      })
      .then(() => {
        console.log("[initMirror] ✅ WebARRock initialized successfully!")
        attachListeners()
        updateSizingFromContainer()
        setIsReady(true)
        setIsMirrorReady(true)
        setStatusMessage("AR aktif")
        console.log("[initMirror] 🎉 AR is now active and ready")
        void refreshDevices()
      })
      .catch((err: unknown) => {
        console.error("[initMirror] ❌ WebARRock init failed:", err)
        console.error("[initMirror] Error type:", typeof err)
        console.error("[initMirror] Error details:", JSON.stringify(err))
        setIsReady(false)
        setIsMirrorReady(false)
        if (err === "ALREADY_INITIALIZED" || err === "ALREADY_DESTROYING") {
          console.log("[initMirror] ℹ️ Special case error (already initialized/destroying), not throwing")
          return
        }
        isInitializedRef.current = false
        throw err
      })
      .finally(() => {
        console.log("[initMirror] 🏁 Init flight completed, cleaning up flags")
        _initInFlight = null
        initFlag.value = false
      })
    return _initInFlight
  }, [attachListeners, detachListeners, deviceId, devices, refreshDevices, updateSizingFromContainer])

  const requestCameraPermission = async (forPreview: boolean) => {
    console.log("[requestCameraPermission] 🎥 Starting, forPreview:", forPreview)
    try {
      if (forPreview) {
        console.log("[requestCameraPermission] 📹 Preview mode, calling startVideoStream")
        await startVideoStream()
        return
      }
      
      console.log("[requestCameraPermission] 🔍 Checking getUserMedia support...")
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.error("[requestCameraPermission] ❌ getUserMedia not supported")
        setCameraError("Browser tidak mendukung kamera (getUserMedia).")
        throw new Error("Browser tidak mendukung kamera (getUserMedia).")
      }
      
      console.log("[requestCameraPermission] ✅ getUserMedia supported")
      console.log("[requestCameraPermission] 🔄 Refreshing devices...")
      const preferredDeviceId = await refreshDevices()
      console.log("[requestCameraPermission] 📱 Preferred device:", preferredDeviceId)
      
      const primaryConstraints: MediaStreamConstraints = {
        video: preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : true,
      }
      console.log("[requestCameraPermission] 📋 Primary constraints:", primaryConstraints)
      
      let stream: MediaStream
      try {
        console.log("[requestCameraPermission] 📸 Requesting media stream...")
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints)
        console.log("[requestCameraPermission] ✅ Media stream obtained successfully")
      } catch (err: unknown) {
        const name = getErrorName(err)
        console.warn("[requestCameraPermission] ⚠️ Primary request failed with:", name)
        
        if (name === "NotReadableError" || name === "OverconstrainedError") {
          console.log("[requestCameraPermission] 🔄 Retrying with fallback constraints...")
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
          console.log("[requestCameraPermission] ✅ Fallback stream obtained")
        } else {
          throw err
        }
      }
      
      console.log("[requestCameraPermission] 🛑 Stopping permission test stream...")
      stream.getTracks().forEach((t) => t.stop())
      console.log("[requestCameraPermission] 🔄 Refreshing devices after permission...")
      await refreshDevices()
      setCameraError(null)
      console.log("[requestCameraPermission] ✅ Camera permission granted successfully")
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, "Izin kamera ditolak atau gagal.")
      console.error("[requestCameraPermission] ❌ Failed:", errorMsg)
      console.error("[requestCameraPermission] Error details:", err)
      setCameraError(errorMsg)
    }
  }

  const handleDeviceChange = async (newDeviceId: string | null) => {
    setDeviceId(newDeviceId)
    if (cameraOnly) return
    if (!newDeviceId) return
    try {
      setStatusMessage("Mengganti kamera...")
      await requestCameraPermission(false)
      if (_initInFlight) {
        await _initInFlight.catch(() => {})
      }
      await ensureDestroyed()
      const initFlag = getInitFlag()
      initFlag.value = false
      await initMirror({ deviceId: { exact: newDeviceId } })
    } catch (err: unknown) {
      setCameraError(getErrorMessage(err, "Gagal mengganti kamera."))
    } finally {
      setStatusMessage(null)
    }
  }

  useEffect(() => {
    if (!active) return
    const loadDevices = async () => {
      console.log("[VTOGlassesAR] 🔍 Loading camera devices...")
      await refreshDevices()
    }
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      void loadDevices()
    }

    return () => {
      try {
        console.log("[VTOGlassesAR] 🛑 Pausing AR on cleanup...")
        mirrorHelper.pause(true)
      } catch {
        // ignore
      }
      detachListeners()
      stopVideoStream()
      setIsMirrorReady(false)
      const initFlag = getInitFlag()
      initFlag.value = false
      setIsReady(false)
      if (!_destroyInFlight) {
        console.log("[VTOGlassesAR] 🗑️ Destroying WebARRock instance...")
        _destroyInFlight = mirrorHelper
          .destroy()
          .catch((err: unknown) => {
            if (err === "ALREADY_DESTROYING") return
            console.warn("[VTOGlassesAR] ⚠️ Error destroying:", err)
          })
          .finally(() => {
            _destroyInFlight = null
            console.log("[VTOGlassesAR] ✅ WebARRock destroyed")
          })
      }
    }
  }, [active, detachListeners, ensureDestroyed, refreshDevices, stopVideoStream])

  // REMOVED: Auto-initialization useEffect
  // Camera MUST be triggered by explicit user button click (handleStart)
  // This ensures getUserMedia has proper user gesture context

  useEffect(() => {
    if (active) return
    console.log("[VTOGlassesAR] ⏹️ Active=false, resetting state...")
    autoInitRef.current = false
    setStatusMessage(null)
    setCameraError(null)
    setIsReady(false)
    setIsMirrorReady(false)
    detachListeners()
    stopVideoStream()
    void ensureDestroyed()
  }, [active, detachListeners, ensureDestroyed, stopVideoStream])

  useEffect(() => {
    setModelError(null)
  }, [modelUrl, occluderUrl])

  // NOTE: We intentionally avoid auto re-init on device change to prevent
  // multiple init/destroy cycles that can stall AR in Next.js dev mode.

  const handleStart = async () => {
    console.log("[VTOGlassesAR] 🚀 Step 1: User clicked Start AR button")
    console.log("[VTOGlassesAR] 📍 window.isSecureContext:", typeof window !== "undefined" ? window.isSecureContext : "N/A")
    console.log("[VTOGlassesAR] 📍 navigator.mediaDevices:", typeof navigator !== "undefined" && navigator?.mediaDevices ? "Available" : "NOT AVAILABLE")
    
    setCameraError(null)
    setStatusMessage("Meminta izin kamera...")
    
    if (typeof window !== "undefined" && !window.isSecureContext) {
      const errorMsg = "Camera memerlukan HTTPS atau localhost."
      console.error("[VTOGlassesAR] ❌ Not secure context:", errorMsg)
      setCameraError(errorMsg)
      setStatusMessage(null)
      return
    }
    
    setIsStarting(true)
    setIsReady(false)
    
    try {
      console.log("[VTOGlassesAR] 🎥 Step 2: Requesting camera permission...")
      
      if (cameraOnly) {
        await requestCameraPermission(true)
        console.log("[VTOGlassesAR] ✅ Camera-only mode ready")
        setStatusMessage(null)
        setIsReady(true)
        return
      }
      
      // Request camera permission first
      await requestCameraPermission(false)
      console.log("[VTOGlassesAR] ✅ Step 3: Camera permission granted")
      
      // Ensure canvas is sized before init
      const nextSizing = getContainerSizing()
      setSizing(nextSizing)
      
      if (!canvasFaceRef.current) {
        throw new Error("Canvas belum siap. Coba lagi.")
      }
      
      canvasFaceRef.current.width = Math.max(1, Math.floor(nextSizing.width))
      canvasFaceRef.current.height = Math.max(1, Math.floor(nextSizing.height))
      console.log("[VTOGlassesAR] 📐 Canvas sized:", canvasFaceRef.current.width, "x", canvasFaceRef.current.height)
      
      setStatusMessage("Memulai AR...")
      console.log("[VTOGlassesAR] 🔧 Step 4: Initializing WebARRock...")
      
      // Reset autoInitRef to allow initialization
      autoInitRef.current = false
      
      if (!isMirrorReady && !_initInFlight) {
        console.log("[VTOGlassesAR] 🎬 Calling initMirror()...")
        await initMirror()
        console.log("[VTOGlassesAR] ✅ Step 5: WebARRock initialized successfully!")
      } else {
        console.log("[VTOGlassesAR] ⚠️ Mirror already ready or init in flight")
      }
    } catch (err: unknown) {
      console.error("[VTOGlassesAR] ❌ Error during start:", err)
      console.error("[VTOGlassesAR] ❌ Error name:", err && typeof err === "object" && "name" in err ? err.name : "Unknown")
      console.error("[VTOGlassesAR] ❌ Error message:", err instanceof Error ? err.message : String(err))
      setCameraError(getErrorMessage(err, "Gagal mengaktifkan kamera."))
      setStatusMessage(null)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {cameraOnly && (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
            zIndex: 1,
          }}
        />
      )}
      {!cameraOnly && (
        <Canvas
          style={{
            position: "absolute",
            zIndex: 2,
            top: sizing.top,
            left: sizing.left,
            width: sizing.width,
            height: sizing.height,
            transform: "scaleX(-1)",
            pointerEvents: "none",
          }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <ThreeGrabber sizing={sizing} lighting={_settings.lighting} />

          <Suspense fallback={<DebugCube />}>
            <VTOModelContainer
              GLTFModel={modelUrl}
              GLTFOccluderModel={_settings.GLTFOccluderModel}
              onModelError={setModelError}
            />
          </Suspense>

          <EffectComposer>
            <Bloom
              luminanceThreshold={_settings.bloom.threshold}
              luminanceSmoothing={_settings.bloom.luminanceSmoothing}
              intensity={_settings.bloom.intensity}
              kernelSize={_settings.bloom.kernelSizeLevel}
              height={_settings.bloom.computeScale * sizing.height}
            />
          </EffectComposer>
        </Canvas>
      )}
      {!cameraOnly && (
        <canvas
          ref={canvasFaceRef}
          style={{
            position: "absolute",
            zIndex: 1,
            top: sizing.top,
            left: sizing.left,
            width: sizing.width,
            height: sizing.height,
            transform: "scaleX(-1)",
            pointerEvents: "none",
          }}
          width={sizing.width}
          height={sizing.height}
        />
      )}

      {modelError && (
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            zIndex: 26,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            maxWidth: "70%",
          }}
        >
          {modelError}
        </div>
      )}

      {(!isSecure || cameraError || (!isReady && !cameraOnly)) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            zIndex: 25,
            padding: "16px",
            textAlign: "center",
            pointerEvents: "auto",
          }}
        >
          <div style={{ maxWidth: "320px", display: "grid", gap: "10px" }}>
            <div style={{ fontWeight: 700 }}>Aktifkan izin kamera</div>
            {statusMessage && (
              <div style={{ fontSize: "12px", lineHeight: 1.4, opacity: 0.9 }}>
                {statusMessage}
              </div>
            )}
            {!isSecure && (
              <div style={{ fontSize: "14px", lineHeight: 1.4 }}>
                Buka dengan https atau localhost agar kamera diizinkan oleh browser.
              </div>
            )}
            {cameraError && (
              <div style={{ fontSize: "14px", lineHeight: 1.4 }}>{cameraError}</div>
            )}
            {devices.length > 0 && (
              <select
                value={deviceId ?? ""}
                onChange={(e) => void handleDeviceChange(e.target.value || null)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              >
                <option value="">Default camera</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || d.deviceId}
                  </option>
                ))}
              </select>
            )}
            {devices.length === 0 && (
              <div style={{ fontSize: "12px", lineHeight: 1.4, opacity: 0.85 }}>
                Kamera belum terdeteksi. Klik tombol di bawah untuk muat ulang daftar kamera.
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                void refreshDevices()
                if (!isReady && !isStarting) void handleStart()
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Muat ulang daftar kamera
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: isStarting ? "#356fb0" : "#4a90e2",
                color: "#fff",
                cursor: isStarting ? "not-allowed" : "pointer",
              }}
            >
              {isStarting ? "Meminta izin..." : "Izinkan Kamera"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
