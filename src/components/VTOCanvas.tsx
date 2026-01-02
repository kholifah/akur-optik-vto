// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client"

// import React, { useEffect, useRef, useState } from "react"
// import Image from "next/image"
// import { computeTransformFromEyes } from "../../lib/overlay"
// import * as THREE from 'three'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// type Props = {
// 	imageSrc: string
// 	alt?: string
// 	frameWidthMm?: number
// 	modelUrl?: string // Optional 3D model for WebAR.rocks.face rendering
//     modelOffset?: { x?: number; y?: number; z?: number; scale?: number; rotation?: number }
// }

// export default function VTOCanvas({ imageSrc, alt, frameWidthMm, modelUrl, modelOffset }: Props) {
// 	const videoRef = useRef<HTMLVideoElement | null>(null)
// 	const containerRef = useRef<HTMLDivElement | null>(null)

// 	const [streamError, setStreamError] = useState<string | null>(null)
// 	const [uploadedImage, setUploadedImage] = useState<string | null>(null)
// 	const [useWebARRocks, setUseWebARRocks] = useState(false)
// 	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
// 	const [deviceId, setDeviceId] = useState<string | null>(null)

// 	// Overlay transform state (px, px, scale, rotation degrees)
// 	const [x, setX] = useState<number | null>(null)
// 	const [y, setY] = useState<number | null>(null)
// 	const [scale, setScale] = useState<number>(1)
// 	const [rotation, setRotation] = useState<number>(0)

// 	const dragging = useRef(false)
// 	const lastPos = useRef<{ x: number; y: number } | null>(null)

// 	// Overlay transform state (px, px, scale, rotation degrees)
// 	useEffect(() => {
// 		let mounted = true
// 		let cameraInstance: any = null
// 		let faceMesh: any = null

// 		// If WebAR.rocks is available and a modelUrl is provided, mark it
// 		if (modelUrl && typeof window !== 'undefined' && (window as any).WEBARROCKSFACE) {
// 			setUseWebARRocks(true)
// 			return
// 		}

// 		async function loadScript(src: string) {
// 			if (document.querySelector(`script[src="${src}"]`)) return
// 			return new Promise<void>((resolve, reject) => {
// 				const s = document.createElement("script")
// 				s.src = src
// 				s.async = true
// 				s.onload = () => resolve()
// 				s.onerror = () => reject(new Error(`Failed to load ${src}`))
// 				document.head.appendChild(s)
// 			})
// 		}

// 		async function setupFaceMesh(selectedDeviceId?: string | null) {
// 			if (!videoRef.current) return
// 			try {
// 				// request camera with optional deviceId
// 				const constraints: MediaStreamConstraints = {
// 					video: selectedDeviceId
// 						? { deviceId: { exact: selectedDeviceId } }
// 						: { facingMode: 'user' },
// 				}
// 				const s = await navigator.mediaDevices.getUserMedia(constraints)
// 				if (!mounted) return
// 				videoRef.current!.srcObject = s
// 				await videoRef.current!.play().catch(() => {})
// 				setUploadedImage(null)

// 				// Load mediapipe packages from CDN
// 				await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
// 				await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')

// 				const FaceMesh = (window as any).FaceMesh
// 				const Camera = (window as any).Camera
// 				if (!FaceMesh || !Camera) return

// 				faceMesh = new FaceMesh({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` })
// 				faceMesh.setOptions({
// 					maxNumFaces: 1,
// 					refineLandmarks: true,
// 					minDetectionConfidence: 0.5,
// 					minTrackingConfidence: 0.5,
// 				})

// 				faceMesh.onResults((results: any) => {
// 					if (!mounted) return
// 					if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return
// 					const landmarks = results.multiFaceLandmarks[0]
// 					const left = landmarks[33]
// 					const right = landmarks[263]
// 					const nose = landmarks[6]
// 					const videoEl = videoRef.current
// 					if (!videoEl) return
// 					const w = videoEl.videoWidth || videoEl.clientWidth || 640
// 					const h = videoEl.videoHeight || videoEl.clientHeight || 480
// 					const leftPt: [number, number] = [left.x * w, left.y * h]
// 					const rightPt: [number, number] = [right.x * w, right.y * h]
// 					const nosePt: [number, number] = [nose.x * w, nose.y * h]
// 					const t = computeTransformFromEyes(leftPt, rightPt, nosePt, frameWidthMm)
// 					setX(t.x)
// 					setY(t.y)
// 					setScale(t.scale)
// 					setRotation(t.rotation)

// 					// If Three.js model is loaded, update its transform to match the detected face
// 					try {
// 						const rect = containerRef.current?.getBoundingClientRect()
// 						if (rect && (window as any).__VTO_THREE && (window as any).__VTO_THREE.model) {
// 							const env = (window as any).__VTO_THREE
// 							const model = env.model
// 							// Convert face center (t.x, t.y) to three coordinates (origin at center)
// 							const rx = t.x - rect.width / 2
// 							const ry = -(t.y - rect.height / 2)
// 							const offset = modelOffset ?? { x: 0, y: 0, z: 0, scale: 1, rotation: 0 }
// 							model.position.set(rx + (offset.x ?? 0), ry + (offset.y ?? 0), (offset.z ?? 0))
// 							const s = (t.scale ?? 1) * (rect.width / 400) * (offset.scale ?? 1)
// 							model.scale.set(s, s, s)
// 							model.rotation.set(0, 0, ((t.rotation ?? 0) + (offset.rotation ?? 0)) * (Math.PI / 180))
// 						}
// 					} catch (e) {
// 						// ignore three update errors
// 					}
// 				})

// 				cameraInstance = new Camera(videoRef.current, {
// 					onFrame: async () => {
// 						if (videoRef.current) await faceMesh.send({ image: videoRef.current })
// 					},
// 					width: 640,
// 					height: 480,
// 				})

// 				cameraInstance.start()
// 			} catch (err: unknown) {
// 				let name = ''
// 				if (err && typeof err === 'object' && 'name' in err) name = String((err as any).name)
// 				if (name === 'NotFoundError' || name === 'OverconstrainedError') {
// 					setStreamError('No camera device found. Please connect a camera or choose another device.')
// 					// refresh device list
// 					try { const list = await navigator.mediaDevices.enumerateDevices(); setDevices(list.filter(d => d.kind === 'videoinput')) } catch (e) { /* ignore */ }
// 				} else if (name === 'NotAllowedError' || name === 'SecurityError') {
// 					setStreamError('Camera access blocked. Please allow camera permissions in your browser.')
// 				} else {
// 					setStreamError(String(err))
// 				}
// 			}
// 		}

// 		// initial device enumeration
// 		;(async () => {
// 			try {
// 				const list = await navigator.mediaDevices.enumerateDevices()
// 				setDevices(list.filter((d) => d.kind === 'videoinput'))
// 			} catch (e) { /* ignore */ }
// 		})()

// 		// attempt to start with selected device or default facingMode
// 		setupFaceMesh(deviceId).catch(() => {})

// 		// If a modelUrl is provided, instantiate Three.js renderer and load GLB using local imports
// 		if (modelUrl) {
// 			;(async () => {
// 				try {
// 				const rect = containerRef.current?.getBoundingClientRect()
// 				const w = rect?.width ?? 640
// 				const h = rect?.height ?? 480

// 				const renderer = new THREE.WebGLRenderer({ alpha: true })
// 				renderer.setSize(w, h)
// 				renderer.domElement.style.position = 'absolute'
// 				renderer.domElement.style.left = '0'
// 				renderer.domElement.style.top = '0'
// 				containerRef.current?.appendChild(renderer.domElement)

// 				const scene = new THREE.Scene()
// 				const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 2000)
// 				camera.position.z = 1000

// 				const light = new THREE.DirectionalLight(0xffffff, 0.8)
// 				light.position.set(0, 0, 1)
// 				scene.add(light)

// 				// simple ambient light
// 				scene.add(new THREE.AmbientLight(0xffffff, 0.6))

// 				const loader = new GLTFLoader()
// 				const gltf = await new Promise<any>((resolve, reject) => {
// 					loader.load(modelUrl, resolve, undefined, reject)
// 				})
// 				const model = gltf.scene || gltf.scenes?.[0]
// 				// apply modelOffset if provided via prop
// 				const offset = modelOffset ?? { x: 0, y: 0, z: 0, scale: 1, rotation: 0 }
// 				model.position.set(offset.x ?? 0, offset.y ?? 0, offset.z ?? 0)
// 				const s0 = offset.scale ?? 1
// 				model.scale.set(s0, s0, s0)
// 					model.rotation.set(0, 0, (offset.rotation ?? 0) * (Math.PI / 180))
// 					;(scene as any).add(model)

// 				// store references for updates from face detection
// 				(window as any).__VTO_THREE = { renderer, scene, camera, model }

// 				function animate() {
// 					requestAnimationFrame(animate)
// 					renderer.render(scene, camera)
// 				}
// 				animate()
// 				} catch (e) {
// 					// ignore three init errors
// 				}
// 			})()
// 		}

// 		return () => {
// 			mounted = false
// 			try {
// 				if (cameraInstance && typeof cameraInstance.stop === 'function') {
// 					cameraInstance.stop()
// 				}
// 				if (faceMesh && typeof faceMesh.close === 'function') {
// 					faceMesh.close()
// 				}
// 			} catch {
// 				// ignore
// 			}
// 		}
// 	}, [modelUrl, deviceId, frameWidthMm])

// 	const [mounted, setMounted] = useState(false)

// 	useEffect(() => {
// 		setMounted(true)
// 		// center overlay initially after mount
// 		const rect = containerRef.current?.getBoundingClientRect()
// 		if (rect) {
// 			setX(rect.width / 2)
// 			setY(rect.height / 2)
// 		}
// 	}, [])

// 	function onPointerDown(e: React.PointerEvent) {
// 		const p = { x: e.clientX, y: e.clientY }
// 		dragging.current = true
// 		lastPos.current = p;
// 		(e.target as Element).setPointerCapture(e.pointerId)
// 	}

// 	function onPointerMove(e: React.PointerEvent) {
// 		if (!dragging.current || !lastPos.current) return
// 		const dx = e.clientX - lastPos.current.x
// 		const dy = e.clientY - lastPos.current.y
// 		setX((v) => (v ?? 0) + dx)
// 		setY((v) => (v ?? 0) + dy)
// 		lastPos.current = { x: e.clientX, y: e.clientY }
// 	}

// 	function onPointerUp(e: React.PointerEvent) {
// 		dragging.current = false
// 		lastPos.current = null
// 		try {
// 			;(e.target as Element).releasePointerCapture(e.pointerId)
// 		} catch {}
// 	}

// 	function onWheel(e: React.WheelEvent) {
// 		e.preventDefault()
// 		const delta = -e.deltaY
// 		const factor = delta > 0 ? 1.05 : 0.95
// 		setScale((s) => Math.max(0.1, Number((s * factor).toFixed(3))))
// 	}

// 	function reset() {
// 		const rect = containerRef.current?.getBoundingClientRect()
// 		if (rect) {
// 			setX(rect.width / 2)
// 			setY(rect.height / 2)
// 		} else {
// 			setX(0)
// 			setY(0)
// 		}
// 		setScale(1)
// 		setRotation(0)
// 	}

// 	return (
// 		<div className="w-full max-w-xl">
// 			<div ref={containerRef} className="relative bg-black/5 overflow-hidden rounded-lg" style={{ aspectRatio: "4/3" }}>
// 				{uploadedImage ? (
// 					<img src={uploadedImage} className="w-full h-full object-cover" alt="uploaded" />
// 				) : (
// 					<video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
// 				)}

// 				<div
// 					onPointerDown={onPointerDown}
// 					onPointerMove={onPointerMove}
// 					onPointerUp={onPointerUp}
// 					onPointerCancel={onPointerUp}
// 					onWheel={onWheel}
// 					style={{
// 						position: "absolute",
// 						left: x ?? "50%",
// 						top: y ?? "50%",
// 						transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
// 						touchAction: "none",
// 						pointerEvents: "auto",
// 						maxWidth: "80%",
// 						userSelect: "none",
// 						display: "flex",
// 						alignItems: "center",
// 						justifyContent: "center",
// 					}}
// 				>
// 					<Image src={imageSrc} alt={alt ?? "overlay"} width={320} height={160} className="object-contain" />
// 				</div>

// 				<div className="absolute left-2 top-2 flex items-center gap-2">
// 					{devices && devices.length > 0 ? (
// 						<select
// 							value={deviceId ?? ''}
// 							onChange={(e) => setDeviceId(e.target.value || null)}
// 							className="rounded bg-white/90 px-2 py-1 text-sm"
// 						>
// 							<option value="">Default camera</option>
// 							{devices.map((d) => (
// 								<option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
// 							))}
// 						</select>
// 					) : null}
// 					<button
// 						onClick={() => { setStreamError(null); setDeviceId(null); }}
// 						className="rounded bg-white/90 px-2 py-1 text-sm"
// 					>
// 						Retry
// 					</button>

// 					<label className="rounded bg-white/90 px-2 py-1 text-sm cursor-pointer">
// 						Upload
// 						<input type="file" accept="image/*" className="hidden" onChange={(e) => {
// 							const f = e.target.files?.[0]
// 							if (!f) return
// 							const url = URL.createObjectURL(f)
// 							// stop any active stream
// 							try { if (videoRef.current && videoRef.current.srcObject) { const s = videoRef.current.srcObject as MediaStream; s.getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null } } catch {}
// 							setUploadedImage(url)
// 						}} />
// 					</label>
// 	                <button
// 						onClick={() => setScale((s) => s * 1.1)}
// 						className="rounded bg-white/90 px-2 py-1 text-sm"
// 					>
// 						+
// 					</button>
// 					<button
// 						onClick={() => setScale((s) => Math.max(0.1, s * 0.9))}
// 						className="rounded bg-white/90 px-2 py-1 text-sm"
// 					>
// 						-
// 					</button>
// 					<button onClick={() => setRotation((r) => r - 5)} className="rounded bg-white/90 px-2 py-1 text-sm">
// 						↺
// 					</button>
// 					<button onClick={() => setRotation((r) => r + 5)} className="rounded bg-white/90 px-2 py-1 text-sm">
// 						↻
// 					</button>
// 					<button onClick={reset} className="rounded bg-white/90 px-2 py-1 text-sm">
// 						reset
// 					</button>
// 				</div>

// 				{streamError && <div className="absolute inset-0 grid place-items-center text-sm text-red-600">{streamError}</div>}
// 			</div>
// 			<p className="text-xs text-muted-foreground mt-2">Drag the frame to position; scroll to scale.</p>
// 		</div>
// 	)
// }


/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { computeTransformFromEyes } from "../../lib/overlay"

type Props = {
  imageSrc: string
  alt?: string
  frameWidthMm?: number
}

export default function VTOCanvas({
  imageSrc,
  alt,
  frameWidthMm = 135, // average glasses width
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)

  // realtime AR transform
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  // ---------------------------
  // CAMERA + MEDIAPIPE INIT
  // ---------------------------
  useEffect(() => {
    let mounted = true
    let cameraInstance: any = null
    let faceMesh: any = null

    async function loadScript(src: string) {
      if (document.querySelector(`script[src="${src}"]`)) return
      return new Promise<void>((resolve, reject) => {
        const s = document.createElement("script")
        s.src = src
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject()
        document.head.appendChild(s)
      })
    }

    async function init() {
      try {
        if (!videoRef.current) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js")
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js")

        const FaceMesh = (window as any).FaceMesh
        const Camera = (window as any).Camera

        faceMesh = new FaceMesh({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        })

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        faceMesh.onResults((res: any) => {
          if (!mounted) return
          if (!res.multiFaceLandmarks?.length) return

          const lm = res.multiFaceLandmarks[0]
          const leftEye = lm[33]
          const rightEye = lm[263]
          const nose = lm[6]

          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return

          const vw = videoRef.current!.videoWidth
          const vh = videoRef.current!.videoHeight

          const left: [number, number] = [
            leftEye.x * vw,
            leftEye.y * vh,
          ]
          const right: [number, number] = [
            rightEye.x * vw,
            rightEye.y * vh,
          ]
          const nosePt: [number, number] = [
            nose.x * vw,
            nose.y * vh,
          ]

          const t = computeTransformFromEyes(left, right, nosePt, frameWidthMm)

          // map to container space
          setX((t.x / vw) * rect.width)
          setY((t.y / vh) * rect.height)
          setScale(t.scale * 0.9)
          setRotation(t.rotation)
        })

        cameraInstance = new Camera(videoRef.current, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.current })
          },
          width: 640,
          height: 480,
        })

        cameraInstance.start()
      } catch (err: any) {
        setStreamError("Camera access failed. Please allow permissions.")
      }
    }

    init()

    return () => {
      mounted = false
      try {
        cameraInstance?.stop()
        faceMesh?.close()
        const s = videoRef.current?.srcObject as MediaStream
        s?.getTracks().forEach((t) => t.stop())
      } catch {}
    }
  }, [frameWidthMm])

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="w-full flex justify-center">
      <div
        ref={containerRef}
        className="bg-secondary rounded-lg flex items-center justify-center overflow-hidden
                   w-full max-w-[520px]
                   h-[60vh] md:h-[70vh] relative"
      >
        {/* CAMERA OR UPLOADED IMAGE */}
        {uploadedImage ? (
          <img
            src={uploadedImage}
            className="absolute inset-0 w-full h-full object-cover"
            alt="uploaded"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {/* REALTIME AR OVERLAY */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
            width: "55%",
            height: "30%",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src={imageSrc}
              alt={alt ?? "glasses"}
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="absolute left-2 top-2 flex gap-2 z-10">
          <label className="bg-white/90 px-2 py-1 rounded text-xs cursor-pointer">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const url = URL.createObjectURL(f)
                setUploadedImage(url)
              }}
            />
          </label>
        </div>

        {streamError && (
          <div className="absolute inset-0 grid place-items-center text-red-600 text-sm">
            {streamError}
          </div>
        )}
      </div>
    </div>
  )
}
