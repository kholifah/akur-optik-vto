"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { Box3, Vector3 } from "three"

import NN from "@/contrib/WebARRocksFace/neuralNets/NN_GLASSES_6.json"
import mirrorHelper from "@/contrib/WebARRocksFace/helpers/WebARRocksMirror.js"

type Props = {
  modelUrl?: string
  occluderUrl?: string
  envMapUrl?: string
  cameraOnly?: boolean
}

type VideoSettingsOverride = MediaTrackConstraints | true

let _threeFiber: any = null
let _initInFlight: Promise<void> | null = null
let _destroyInFlight: Promise<void> | null = null
const getInitFlag = () => {
  if (typeof window === "undefined") return { value: false }
  const w = window as any
  if (!w.__WEBARROCKS_INIT_FLAG) w.__WEBARROCKS_INIT_FLAG = { value: false }
  return w.__WEBARROCKS_INIT_FLAG as { value: boolean }
}

const ThreeGrabber = (props: { sizing: Sizing; lighting: LightingSpec }) => {
  const threeFiber = useThree()
  _threeFiber = threeFiber

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

const VTOModelContainer = (props: {
  GLTFModel: string
  GLTFOccluderModel: string
  sizing: Sizing
  faceIndex: number
  glassesBranches: GlassesBranchSpec
  isMirrorReady: boolean
  onModelError?: (message: string | null) => void
}) => {
  const [modelScene, setModelScene] = useState<any>(null)
  const [occluderMesh, setOccluderMesh] = useState<any>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [occluderLoaded, setOccluderLoaded] = useState(false)
  const fittedRef = useRef(false)

  const objRef = useRef<any>(null)
  useEffect(() => {
    mirrorHelper.clean()
    fittedRef.current = false
    return () => {
      mirrorHelper.clean()
    }
  }, [props.GLTFModel, props.GLTFOccluderModel])

  useEffect(() => {
    if (!props.isMirrorReady) return
    const threeObject3DParent = objRef.current
    if (!threeObject3DParent || threeObject3DParent.children.length === 0) return
    const threeObject3D = threeObject3DParent.children[0]
    if (!threeObject3D || threeObject3D.children.length === 0) return
    const model = threeObject3D.children[0]

    // Use the tested set_glassesPose helper instead of custom positioning
    if (!fittedRef.current) {
      mirrorHelper.set_glassesPose(model)
      fittedRef.current = true
    }
    mirrorHelper.tweak_materials(model, props.glassesBranches)
    mirrorHelper.set_faceFollower(threeObject3DParent, threeObject3D, props.faceIndex)
  }, [
    props.GLTFModel,
    props.sizing,
    props.faceIndex,
    props.glassesBranches,
    props.isMirrorReady,
    modelScene,
    occluderMesh,
  ])

  useEffect(() => {
    let cancelled = false
    setModelScene(null)
    setOccluderMesh(null)
    setModelLoaded(false)
    setOccluderLoaded(false)
    props.onModelError?.(null)

    const loader = new GLTFLoader()
    loader.load(
      props.GLTFModel,
      (gltf) => {
        if (cancelled) return
        const scene = (gltf.scene || gltf.scenes?.[0])?.clone?.() ?? null
        if (!scene) {
          props.onModelError?.("Model 3D kosong atau tidak valid.")
          return
        }
        setModelScene(scene)
        setModelLoaded(true)
      },
      undefined,
      () => {
        if (cancelled) return
        props.onModelError?.("Gagal memuat model 3D. Periksa file GLB.")
      }
    )

    const loaderOccluder = new GLTFLoader()
    loaderOccluder.load(
      props.GLTFOccluderModel,
      (gltf) => {
        if (cancelled) return
        const occluderScene = (gltf.scene || gltf.scenes?.[0])?.clone?.() ?? null
        if (!occluderScene) {
          props.onModelError?.("Occluder 3D kosong atau tidak valid.")
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
        props.onModelError?.("Gagal memuat occluder 3D. Periksa file GLB.")
      }
    )

    return () => {
      cancelled = true
    }
  }, [props.GLTFModel, props.GLTFOccluderModel])

  useEffect(() => {
    if (modelLoaded && occluderLoaded) props.onModelError?.(null)
  }, [modelLoaded, occluderLoaded, props.onModelError])

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
  modelUrl = "", //"/models3D/glasses1.glb"
  occluderUrl = "/models3D/occluder.glb",
  envMapUrl = "/envmaps/venice_sunset_1k.hdr",
  cameraOnly = false,
}: Props) {
  const [sizing, setSizing] = useState<Sizing>(() =>
    typeof window !== "undefined" ? computeSizing() : { width: 640, height: 480, top: 0, left: 0 }
  )
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [modelError, setModelError] = useState<string | null>(null)
  const [isMirrorReady, setIsMirrorReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string | null>(null)

  const canvasFaceRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const autoInitRef = useRef(false)
  const faceDetectedRef = useRef(false)

  const _settings = {
    glassesBranches: {
      fadingZ: -0.9,
      fadingTransition: 0.6,
      bendingAngle: 5,
      bendingZ: 0,
    } satisfies GlassesBranchSpec,

    lighting: {
      envMap: envMapUrl,
      pointLightIntensity: 0.8,
      pointLightY: 200,
      hemiLightIntensity: 0,
    } satisfies LightingSpec,

    GLTFOccluderModel: occluderUrl,

    bloom: {
      threshold: 0.5,
      intensity: 8,
      kernelSizeLevel: 0,
      computeScale: 0.5,
      luminanceSmoothing: 0.7,
    },
  }


  const isSecure = typeof window !== "undefined" && window.isSecureContext

  const getContainerSizing = () => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect?.width && rect?.height) {
      return { width: rect.width, height: rect.height, top: 0, left: 0 }
    }
    return computeSizing()
  }

  const updateSizingFromContainer = () => {
    const newSizing = getContainerSizing()
    setSizing(newSizing)
    mirrorHelper.resize()
  }

  const listenersCleanupRef = useRef<null | (() => void)>(null)

  const attachListeners = () => {
    const ro = window.ResizeObserver
      ? new ResizeObserver(() => {
        const newSizing = getContainerSizing()
        setSizing(newSizing)
        mirrorHelper.resize()
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
  }

  const detachListeners = () => {
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current()
      listenersCleanupRef.current = null
    }
  }

  const stopVideoStream = () => {
    try {
      const prev = videoRef.current?.srcObject as MediaStream | null
      prev?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    } catch {
      // ignore
    }
  }

  const refreshDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      const cams = list.filter((d) => d.kind === "videoinput")
      setDevices(cams)
      if (!deviceId && cams.length > 0) setDeviceId(cams[0].deviceId)
    } catch {
      // ignore
    }
  }

  const startVideoStream = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError("Browser tidak mendukung kamera (getUserMedia).")
      throw new Error("Browser tidak mendukung kamera (getUserMedia).")
    }
    stopVideoStream()

    await refreshDevices()

    const primaryConstraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(primaryConstraints)
    } catch (err: any) {
      if (err?.name === "NotReadableError" || err?.name === "OverconstrainedError") {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      } else {
        throw err
      }
    }

    if (!videoRef.current) {
      throw new Error("Video belum siap. Coba lagi.")
    }
    videoRef.current.srcObject = stream
    await videoRef.current.play().catch(() => { })

    // wait for video to have dimensions
    await new Promise<void>((resolve, reject) => {
      const t0 = Date.now()
      const tick = () => {
        const v = videoRef.current
        if (v && v.videoWidth > 0 && v.videoHeight > 0) return resolve()
        if (Date.now() - t0 > 3000) return reject(new Error("Video belum siap."))
        requestAnimationFrame(tick)
      }
      tick()
    })

    setCameraError(null)
  }

  const ensureDestroyed = async () => {
    if (!_destroyInFlight) {
      _destroyInFlight = mirrorHelper
        .destroy()
        .catch((err: any) => {
          if (err === "ALREADY_DESTROYING") return
        })
        .finally(() => {
          _destroyInFlight = null
        })
    }
    return _destroyInFlight
  }

  const initMirror = async (videoSettingsOverride?: VideoSettingsOverride): Promise<void> => {
    const initFlag = getInitFlag()
    if (initFlag.value) {
      return _initInFlight ?? Promise.reject(new Error("Inisialisasi kamera sedang berjalan."))
    }
    if (_initInFlight) return _initInFlight
    initFlag.value = true
    setFaceDetected(false)
    faceDetectedRef.current = false
    detachListeners()
    if (!canvasFaceRef.current) {
      initFlag.value = false
      return Promise.reject(new Error("Canvas belum siap. Coba lagi."))
    }
    const resolvedVideoSettings =
      videoSettingsOverride ?? (deviceId ? { deviceId: { exact: deviceId } } : undefined)
    _initInFlight = mirrorHelper
      .init({
        NN,
        ...(resolvedVideoSettings ? { videoSettings: resolvedVideoSettings } : {}),
        scanSettings: { threshold: 0.8 },
        landmarksStabilizerSpec: {
          beta: 1,
          minCutOff: 0.004,
          freqRange: [5, 144],
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
        callbackTrack: (detectState: any) => {
          // Hanya set faceDetected = true pada deteksi pertama
          if (detectState.isDetected && !faceDetectedRef.current) {
            faceDetectedRef.current = true
            setFaceDetected(true)
          }
        },
      })
      .then(() => {
        attachListeners()
        updateSizingFromContainer()
        setIsReady(true)
        setIsMirrorReady(true)
        setStatusMessage("AR aktif")
        void refreshDevices()
      })
      .catch((err: any) => {
        setIsReady(false)
        setIsMirrorReady(false)
        if (err === "ALREADY_INITIALIZED" || err === "ALREADY_DESTROYING") return
        throw err
      })
      .finally(() => {
        _initInFlight = null
        initFlag.value = false
      })
    return _initInFlight
  }

  const requestCameraPermission = async (forPreview: boolean) => {
    try {
      if (forPreview) {
        await startVideoStream()
        return
      }
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError("Browser tidak mendukung kamera (getUserMedia).")
        throw new Error("Browser tidak mendukung kamera (getUserMedia).")
      }
      const primaryConstraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints)
      } catch (err: any) {
        if (err?.name === "NotReadableError" || err?.name === "OverconstrainedError") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        } else {
          throw err
        }
      }
      stream.getTracks().forEach((t) => t.stop())
      await refreshDevices()
      setCameraError(null)
    } catch (err: any) {
      setCameraError(err?.message || "Izin kamera ditolak atau gagal.")
    }
  }

  const handleDeviceChange = async (newDeviceId: string | null) => {
    setDeviceId(newDeviceId)
    setFaceDetected(false)
    faceDetectedRef.current = false
    if (cameraOnly) return
    if (!newDeviceId) return
    try {
      setStatusMessage("Mengganti kamera...")
      await requestCameraPermission(false)
      if (_initInFlight) {
        await _initInFlight.catch(() => { })
      }
      await ensureDestroyed()
      const initFlag = getInitFlag()
      initFlag.value = false
      await initMirror({ deviceId: { exact: newDeviceId } })
    } catch (err: any) {
      setCameraError(err?.message || "Gagal mengganti kamera.")
    } finally {
      setStatusMessage(null)
    }
  }

  useEffect(() => {
    const loadDevices = async () => {
      await refreshDevices()
    }
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      void loadDevices()
    }

    return () => {
      _threeFiber = null
      detachListeners()
      stopVideoStream()
      setIsMirrorReady(false)
      setFaceDetected(false)
      faceDetectedRef.current = false
      const initFlag = getInitFlag()
      initFlag.value = false
      setIsReady(false)
      if (!_destroyInFlight) {
        _destroyInFlight = mirrorHelper
          .destroy()
          .catch((err: any) => {
            if (err === "ALREADY_DESTROYING") return
          })
          .finally(() => {
            _destroyInFlight = null
          })
      }
    }
  }, [])

  useEffect(() => {
    if (cameraOnly) return
    if (autoInitRef.current) return
    if (!canvasFaceRef.current) return
    autoInitRef.current = true
    const nextSizing = getContainerSizing()
    setSizing(nextSizing)
    canvasFaceRef.current.width = Math.max(1, Math.floor(nextSizing.width))
    canvasFaceRef.current.height = Math.max(1, Math.floor(nextSizing.height))
    setStatusMessage("Memulai AR...")
    initMirror().catch((err: any) => {
      setCameraError(err?.message || "Gagal mengaktifkan kamera.")
      setStatusMessage(null)
      autoInitRef.current = false
    })
  }, [cameraOnly])

  useEffect(() => {
    setModelError(null)
  }, [modelUrl, occluderUrl])

  // NOTE: We intentionally avoid auto re-init on device change to prevent
  // multiple init/destroy cycles that can stall AR in Next.js dev mode.

  const handleStart = async () => {
    setCameraError(null)
    setStatusMessage("Meminta izin kamera...")
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError("Camera memerlukan HTTPS atau localhost.")
      setStatusMessage(null)
      return
    }
    setIsStarting(true)
    setIsReady(false)
    try {
      if (cameraOnly) {
        await requestCameraPermission(true)
        setStatusMessage(null)
        setIsReady(true)
        return
      }
      await requestCameraPermission(false)
      // ensure canvas is sized before init
      const nextSizing = getContainerSizing()
      setSizing(nextSizing)
      if (!canvasFaceRef.current) {
        throw new Error("Canvas belum siap. Coba lagi.")
      }
      canvasFaceRef.current.width = Math.max(1, Math.floor(nextSizing.width))
      canvasFaceRef.current.height = Math.max(1, Math.floor(nextSizing.height))
      setStatusMessage("Memulai AR...")
      if (!isMirrorReady && !_initInFlight) {
        await initMirror()
      }
    } catch (err: any) {
      setCameraError(err?.message || "Gagal mengaktifkan kamera.")
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
            {faceDetected && (
              <VTOModelContainer
                sizing={sizing}
                GLTFModel={modelUrl}
                GLTFOccluderModel={_settings.GLTFOccluderModel}
                faceIndex={0}
                glassesBranches={_settings.glassesBranches}
                isMirrorReady={isMirrorReady}
                onModelError={setModelError}
              />
            )}
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

      {(!isReady && !cameraOnly) && (
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
              onClick={() => void refreshDevices()}
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
