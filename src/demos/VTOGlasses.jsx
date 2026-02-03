import React, { useEffect, useRef, useState, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// import GLTF loader - originally in examples/jsm/loaders/
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// import components:
// import BackButton from '../components/BackButton'
import GLBViewer from '../components/GLBViewer'
import TryOnToggle3D from '../components/TryOnToggle3D'

// import neural network model:
import NN from '../contrib/WebARRocksFace/neuralNets/NN_GLASSES_6.json'

// import WebARRocksMirror, a helper
// This helper is not minified, feel free to customize it (and submit pull requests bro):
import mirrorHelper from '../contrib/WebARRocksFace/helpers/WebARRocksMirror.js'

// ASSETS:
// import 3D models of sunglasses
import GLTFModel1 from '../../assets/VTOGlasses/models3D/glasses1.glb'
import GLTFModel2 from '../../assets/VTOGlasses/models3D/glasses2.glb'

// import occluder
import GLTFOccluderModel from '../../assets/VTOGlasses/models3D/occluder.glb'

// import envMap:
import envMap from '../../assets/VTOGlasses/envmaps/venice_sunset_1k.hdr'



let _threeFiber = null

// fake component, display nothing
// just used to get the Camera and the renderer used by React-fiber:
const ThreeGrabber = (props) => {
  const threeFiber = useThree()
  _threeFiber = threeFiber

  useFrame(mirrorHelper.update.bind(null, props.sizing, threeFiber.camera))
  mirrorHelper.set_lighting(threeFiber.gl, threeFiber.scene, props.lighting)

  return null
}


const compute_sizing = () => {
  // compute  size of the canvas:
  const height = window.innerHeight
  const wWidth = window.innerWidth
  const width = Math.min(wWidth, height)

  // compute position of the canvas:
  const top = 0
  const left = (wWidth - width) / 2
  return { width, height, top, left }
}


const VTOModelContainer = (props) => {
  mirrorHelper.clean()

  const objRef = useRef()
  useEffect(() => {
    const threeObject3DParent = objRef.current
    if (threeObject3DParent.children.length === 0) return
    const threeObject3D = threeObject3DParent.children[0]
    if (threeObject3D.children.length === 0) return
    const model = threeObject3D.children[0]

    mirrorHelper.set_glassesPose(model)
    mirrorHelper.tweak_materials(model, props.glassesBranches)
    mirrorHelper.set_faceFollower(threeObject3DParent, threeObject3D, props.faceIndex)
    //return mirrorHelper.clean;
  }, [props.GLTFModel, props.sizing])

  // import main model:
  const gltf = useLoader(GLTFLoader, props.GLTFModel)
  const model = gltf.scene.clone()

  // import and create occluder:
  const isDebugOccluder = false // true to debug the occluder
  const gltfOccluder = useLoader(GLTFLoader, props.GLTFOccluderModel)
  const occluderModel = gltfOccluder.scene.clone()
  const occluderMesh = mirrorHelper.create_occluderMesh(occluderModel, isDebugOccluder)

  return (
    <object3D ref={objRef}>
      <object3D>
        <primitive object={model} />
        <primitive object={occluderMesh} />
      </object3D>
    </object3D>
  )
}

const DebugCube = (props) => {
  const s = props.size || 1
  return (
    <mesh name="debugCube">
      <boxGeometry args={[s, s, s]} />
      <meshNormalMaterial />
    </mesh>
  )
}


const VTOGlasses = (props) => {
  const PI = 3.1415
  const scale = 100
  const { modelId } = useParams()

  // Tentukan model dari prop override atau URL param
  const effectiveModelId = props.modelIdOverride || modelId || '1'
  const initialModel = effectiveModelId === '2' ? GLTFModel2 : GLTFModel1

  // state:
  const [sizing, setSizing] = useState(compute_sizing())
  const [model, setModel] = useState(initialModel)
  const [isInitialized] = useState(true)
  const [viewMode, setViewMode] = useState('tryon') // 'tryon' atau '3d'
  const [showGLBViewer, setShowGLBViewer] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  // refs:
  const canvasFaceRef = useRef()
  const containerRef = useRef()

  // misc private vars:
  const _settings = {
    glassesBranches: {
      // Branch fading parameters (branch become transparent near the ears)
      fadingZ: -0.9, // where to start branch fading. - -> to the back
      fadingTransition: 0.6, // 0 -> hard transition

      // Branch bending (glasses branches are always bent to slightly tighten the head):
      bendingAngle: 5, //in degrees. 0 -> no bending
      bendingZ: 0, //start brench bending at this position. - -> to the back
    },

    lighting: {
      envMap,
      pointLightIntensity: 0.6, // reduced intensity untuk performa lebih baik
      pointLightY: 200, // larger -> move the pointLight to the top
      hemiLightIntensity: 0 // intensity of the hemispheric light. Set to 0 to disable (not really useful if we use an envmap)
    },

    // occluder 3D model:
    GLTFOccluderModel,

    bloom: {
      threshold: 0.6, // higher threshold = less pixels processed
      intensity: 5, // reduced intensity untuk performa lebih baik
      kernelSizeLevel: 0, // 0 -> SMALL kernel
      computeScale: 0.4, // lower resolution = faster processing
      luminanceSmoothing: 0.5
    }
  }
  let _timerResize = null
  let _isPaused = false
  const isSecure = typeof window !== 'undefined' && window.isSecureContext


  const getContainerSizing = () => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect?.width && rect?.height) {
      return { width: rect.width, height: rect.height, top: 0, left: 0 }
    }
    return compute_sizing()
  }

  const handle_resize = () => {
    if (_timerResize) {
      clearTimeout(_timerResize)
    }
    _timerResize = setTimeout(() => {
      _timerResize = null
      const newSizing = getContainerSizing()
      setSizing(newSizing)
      mirrorHelper.resize()
    }, 120)
  }

  const updateSizingFromContainer = () => {
    const newSizing = getContainerSizing()
    setSizing(newSizing)
    mirrorHelper.resize()
  }

  const listenersCleanupRef = useRef(null)

  const attachListeners = () => {
    const ro = window.ResizeObserver ? new ResizeObserver(() => {
      const newSizing = getContainerSizing()
      setSizing(newSizing)
      mirrorHelper.resize()
    }) : null
    if (ro && containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', handle_resize)
    window.addEventListener('orientationchange', handle_resize)
    listenersCleanupRef.current = () => {
      if (ro && containerRef.current) ro.unobserve(containerRef.current)
      if (ro) ro.disconnect()
      window.removeEventListener('resize', handle_resize)
      window.removeEventListener('orientationchange', handle_resize)
    }
  }

  const detachListeners = () => {
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current()
      listenersCleanupRef.current = null
    }
  }

  const initMirror = () => {
    detachListeners()
    return mirrorHelper.init({
      NN,
      scanSettings: {
        threshold: 0.8 // detection threshold, between 0 and 1
      },
      landmarksStabilizerSpec: {
        beta: 10,
        minCutOff: 0.001,
        freqRange: [2, 144],
        forceFilterNNInputPxRange: [2.5, 6],//[1.5, 4],
      },
      solvePnPImgPointsLabels: [
        //'chinLeft', 'chinRight',

        'leftEarBottom',
        'rightEarBottom',
        'noseBottom',
        'noseLeft', 'noseRight',
        'leftEyeExt',
        'rightEyeExt'
      ],
      canvasFace: canvasFaceRef.current,
      maxFacesDetected: 1
    }).then(() => {
      attachListeners()
      const newSizing = getContainerSizing()
      setSizing(newSizing)
      mirrorHelper.resize()
      console.log('WEBARROCKSMIRROR helper has been initialized')
    })
  }

  const toggle_mode = async (mode) => {
    setViewMode(mode)
    if (mode === '3d') {
      setShowGLBViewer(true)
      detachListeners()
      mirrorHelper.pause(true)
      return
    }

    setShowGLBViewer(false)
    await mirrorHelper.destroy()
    await initMirror()
    mirrorHelper.resume(true)
    updateSizingFromContainer()
  }

  const requestCameraPermission = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Browser tidak mendukung kamera (getUserMedia).')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      setCameraError(null)
    } catch (err) {
      setCameraError(err?.message || 'Izin kamera ditolak atau gagal.')
    }
  }

  useEffect(() => {
    if (viewMode === 'tryon') {
      // Pastikan sizing sinkron setelah keluar dari GLB viewer
      setTimeout(updateSizingFromContainer, 50)
    }
  }, [viewMode])


  // Jika modelId berubah (modal reuse), update model
  useEffect(() => {
    const newModel = effectiveModelId === '2' ? GLTFModel2 : GLTFModel1
    setModel(newModel)
  }, [effectiveModelId])

  useEffect(() => {
    initMirror()

    return () => {
      _threeFiber = null
      detachListeners()
      return mirrorHelper.destroy()
    }
  }, [isInitialized])



  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Mode 3D Viewer */}
      {viewMode === '3d' && (
        <div style={{ position: 'absolute', width: '100%', height: '100%', inset: 0, zIndex: 10 }} onClick={() => toggle_mode('tryon')}>
          <GLBViewer
            modelPath={model}
            backgroundColor="#ffffff"
            cameraZ={2.5}
            autoRotate={true}
            onModelLoaded={() => console.log('Model 3D loaded')}
          />
        </div>
      )}

      {/* Mode Try-On AR */}
      {viewMode === 'tryon' && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Canvas className='mirrorX' style={{
            position: 'absolute',
            zIndex: 2,
            top: sizing.top,
            left: sizing.left,
            width: sizing.width,
            height: sizing.height
          }}
            gl={{
              preserveDrawingBuffer: true // allow image capture
            }}
          >
            <ThreeGrabber sizing={sizing} lighting={_settings.lighting} />

            <Suspense fallback={<DebugCube />}>
              <VTOModelContainer
                sizing={sizing}
                GLTFModel={model}
                GLTFOccluderModel={_settings.GLTFOccluderModel}
                faceIndex={0} glassesBranches={_settings.glassesBranches} />
            </Suspense>

            <EffectComposer>
              <Bloom luminanceThreshold={_settings.bloom.threshold} luminanceSmoothing={_settings.bloom.luminanceSmoothing} intensity={_settings.bloom.intensity}
                kernelSize={_settings.bloom.kernelSizeLevel}
                height={_settings.bloom.computeScale * sizing.height} />
            </EffectComposer>

          </Canvas>

          <canvas className='mirrorX' ref={canvasFaceRef} style={{
            position: 'absolute',
            zIndex: 1,
            top: sizing.top,
            left: sizing.left,
            width: sizing.width,
            height: sizing.height
          }} width={sizing.width} height={sizing.height} />



          <TryOnToggle3D onClick={() => toggle_mode('3d')} />

          {(!isSecure || cameraError) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              zIndex: 25,
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ maxWidth: '320px', display: 'grid', gap: '10px' }}>
                <div style={{ fontWeight: '700' }}>Aktifkan izin kamera</div>
                {!isSecure && (
                  <div style={{ fontSize: '14px', lineHeight: 1.4 }}>
                    Buka dengan https atau localhost agar kamera diizinkan oleh browser.
                    Coba akses: https://&lt;alamat-ip&gt;:5173 lalu izinkan sertifikat jika diminta.
                  </div>
                )}
                {cameraError && (
                  <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{cameraError}</div>
                )}
                <button
                  type='button'
                  onClick={requestCameraPermission}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: '#4a90e2',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Minta izin kamera
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}

export default VTOGlasses
