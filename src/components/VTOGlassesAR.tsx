"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { Object3D } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import NN from "@/contrib/WebARRocksFace/neuralNets/NN_GLASSES_6.json"
import mirrorHelper from "@/contrib/WebARRocksFace/helpers/WebARRocksMirror.js"

type Props = {
  modelUrl?: string
  occluderUrl?: string
  envMapUrl?: string
  cameraOnly?: boolean
  autoFitModel?: boolean
  active?: boolean
  autoStartCamera?: boolean
  cameraAspectRatio?: number
  fillWidthInContainer?: boolean
}

type Sizing = { width: number; height: number; top: number; left: number }

type LightingSpec = {
  envMap: string
  pointLightIntensity: number
  pointLightY: number
  hemiLightIntensity: number
}

type GlassesBranchSpec = {
  fadingZ: number
  fadingTransition: number
  bendingAngle: number
  bendingZ: number
}

const DEFAULT_CAMERA_ASPECT = 4 / 3

const fitSizingToAspect = (containerWidth: number, containerHeight: number, aspect = DEFAULT_CAMERA_ASPECT): Sizing => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 640, height: 480, top: 0, left: 0 }
  }

  const containerAspect = containerWidth / containerHeight

  if (containerAspect > aspect) {
    const height = containerHeight
    const width = height * aspect
    return {
      width,
      height,
      top: 0,
      left: (containerWidth - width) / 2,
    }
  }

  const width = containerWidth
  const height = width / aspect
  return {
    width,
    height,
    top: (containerHeight - height) / 2,
    left: 0,
  }
}

const fitSizingFullWidth = (containerWidth: number, containerHeight: number, aspect = DEFAULT_CAMERA_ASPECT): Sizing => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 640, height: 480, top: 0, left: 0 }
  }

  const width = containerWidth
  const height = width / aspect
  return {
    width,
    height,
    top: (containerHeight - height) / 2,
    left: 0,
  }
}

const computeSizing = (aspect = DEFAULT_CAMERA_ASPECT, fullWidthInContainer = false): Sizing => {
  const height = window.innerHeight
  const windowWidth = window.innerWidth
  return fullWidthInContainer
    ? fitSizingFullWidth(windowWidth, height, aspect)
    : fitSizingToAspect(windowWidth, height, aspect)
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  return fallback
}

const ThreeGrabber = (props: { sizing: Sizing; lighting: LightingSpec }) => {
  const threeFiber = useThree()

  useFrame(() => {
    mirrorHelper.update(props.sizing, threeFiber.camera)
  })

  useEffect(() => {
    mirrorHelper.set_lighting(threeFiber.gl, threeFiber.scene, props.lighting)
  }, [props.lighting, threeFiber.gl, threeFiber.scene])

  return null
}

type GLTFLike = {
  scene?: Object3D
  scenes?: Object3D[]
}

const toScene = (gltf: unknown): Object3D | null => {
  const safe = gltf as GLTFLike
  return safe.scene ?? safe.scenes?.[0] ?? null
}

const VTOModelContainer = (props: {
  GLTFModel: string
  GLTFOccluderModel: string
  glassesBranches: GlassesBranchSpec
  isMirrorReady: boolean
  onModelError?: (message: string | null) => void
}) => {
  const objRef = useRef<Object3D | null>(null)

  const gltfModel = useLoader(GLTFLoader, props.GLTFModel)
  const gltfOccluder = useLoader(GLTFLoader, props.GLTFOccluderModel)

  const model = useMemo(() => {
    const scene = toScene(gltfModel)
    return scene?.clone() ?? null
  }, [gltfModel])

  const occluderMesh = useMemo(() => {
    const occluderScene = toScene(gltfOccluder)
    if (!occluderScene) return null
    const isDebugOccluder = false
    return mirrorHelper.create_occluderMesh(occluderScene.clone(), isDebugOccluder) as Object3D
  }, [gltfOccluder])

  useEffect(() => {
    props.onModelError?.(null)
    return () => {
      mirrorHelper.clean()
    }
  }, [props, props.GLTFModel, props.GLTFOccluderModel])

  useEffect(() => {
    if (!props.isMirrorReady) return
    const parent = objRef.current
    if (!parent || parent.children.length === 0) return
    const root = parent.children[0]
    if (!root || root.children.length === 0) return
    const modelObject = root.children[0]

    mirrorHelper.set_glassesPose(modelObject)
    mirrorHelper.tweak_materials(modelObject, props.glassesBranches)
    mirrorHelper.set_faceFollower(parent, root, 0)
  }, [props.isMirrorReady, props.glassesBranches, props.GLTFModel])

  if (!model || !occluderMesh) return null

  return (
    <object3D ref={objRef}>
      <object3D>
        <primitive object={model} />
        <primitive object={occluderMesh} />
      </object3D>
    </object3D>
  )
}

const DebugCube = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  )
}

export default function VTOGlassesAR({
  modelUrl = "/models3D/glasses1.glb",
  occluderUrl = "/models3D/occluder.glb",
  envMapUrl = "/envmaps/venice_sunset_1k.hdr",
  cameraOnly = false,
  active = true,
  autoStartCamera = false,
  cameraAspectRatio = DEFAULT_CAMERA_ASPECT,
  fillWidthInContainer = false,
}: Props) {
  const [sizing, setSizing] = useState<Sizing>(() =>
    typeof window !== "undefined"
      ? computeSizing(cameraAspectRatio, fillWidthInContainer)
      : { width: 640, height: 480, top: 0, left: 0 }
  )
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [modelError, setModelError] = useState<string | null>(null)
  const [isMirrorReady, setIsMirrorReady] = useState(false)

  const canvasFaceRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const isSecure = typeof window !== "undefined" && window.isSecureContext

  const settings = useMemo(
    () => ({
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
      bloom: {
        threshold: 0.6,
        intensity: 5,
        kernelSizeLevel: 0,
        computeScale: 0.4,
        luminanceSmoothing: 0.5,
      },
    }),
    [envMapUrl]
  )

  const getContainerSizing = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect?.width && rect?.height) {
      return fillWidthInContainer
        ? fitSizingFullWidth(rect.width, rect.height, cameraAspectRatio)
        : fitSizingToAspect(rect.width, rect.height, cameraAspectRatio)
    }
    return computeSizing(cameraAspectRatio, fillWidthInContainer)
  }, [cameraAspectRatio, fillWidthInContainer])

  const updateSizingFromContainer = useCallback(() => {
    const nextSizing = getContainerSizing()
    setSizing(nextSizing)
    mirrorHelper.resize()
  }, [getContainerSizing])

  useEffect(() => {
    if (!active) return

    if (cameraOnly) {
      let stream: MediaStream | null = null
      const videoEl = videoRef.current

      const startPreview = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
          if (!videoEl) return
          videoEl.srcObject = stream
          await videoEl.play().catch(() => undefined)
          setCameraError(null)
        } catch (err: unknown) {
          setCameraError(getErrorMessage(err, "Gagal membuka kamera"))
        }
      }

      void startPreview()
      return () => {
        stream?.getTracks().forEach((track) => track.stop())
        if (videoEl) videoEl.srcObject = null
      }
    }

    const shouldInit = active && (autoStartCamera || !cameraOnly)
    if (!shouldInit) return

    let cancelled = false

    const onResize = () => updateSizingFromContainer()

    const init = async () => {
      if (!canvasFaceRef.current) return

      try {
        setStatusMessage("Memulai AR...")
        setCameraError(null)

        await mirrorHelper.init({
          NN,
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

        if (cancelled) {
          await mirrorHelper.destroy().catch(() => undefined)
          return
        }

        setIsMirrorReady(true)
        setStatusMessage(null)
        updateSizingFromContainer()

        window.addEventListener("resize", onResize)
        window.addEventListener("orientationchange", onResize)
      } catch (err: unknown) {
        setStatusMessage(null)
        setIsMirrorReady(false)
        setCameraError(getErrorMessage(err, "Gagal mengaktifkan kamera."))
      }
    }

    void init()

    return () => {
      cancelled = true
      setIsMirrorReady(false)
      setStatusMessage(null)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
      try {
        mirrorHelper.pause(true)
      } catch {
        // ignore
      }
      void mirrorHelper.destroy().catch(() => undefined)
    }
  }, [active, autoStartCamera, cameraOnly, updateSizingFromContainer])

  useEffect(() => {
    setModelError(null)
  }, [modelUrl, occluderUrl])

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
        <>
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
            <ThreeGrabber sizing={sizing} lighting={settings.lighting} />

            <Suspense fallback={<DebugCube />}>
              <VTOModelContainer
                GLTFModel={modelUrl}
                GLTFOccluderModel={occluderUrl}
                glassesBranches={settings.glassesBranches}
                isMirrorReady={isMirrorReady}
                onModelError={setModelError}
              />
            </Suspense>

            <EffectComposer>
              <Bloom
                luminanceThreshold={settings.bloom.threshold}
                luminanceSmoothing={settings.bloom.luminanceSmoothing}
                intensity={settings.bloom.intensity}
                kernelSize={settings.bloom.kernelSizeLevel}
                height={settings.bloom.computeScale * sizing.height}
              />
            </EffectComposer>
          </Canvas>

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
        </>
      )}

      {(modelError || statusMessage || !isSecure || cameraError) && (
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
            pointerEvents: "none",
          }}
        >
          <div style={{ maxWidth: "340px", display: "grid", gap: "10px" }}>
            {!isSecure && (
              <div style={{ fontSize: "14px", lineHeight: 1.4 }}>
                Buka dengan https atau localhost agar kamera diizinkan oleh browser.
              </div>
            )}
            {statusMessage && <div style={{ fontSize: "13px", opacity: 0.9 }}>{statusMessage}</div>}
            {cameraError && <div style={{ fontSize: "14px", lineHeight: 1.4 }}>{cameraError}</div>}
            {modelError && <div style={{ fontSize: "13px", lineHeight: 1.4 }}>{modelError}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

