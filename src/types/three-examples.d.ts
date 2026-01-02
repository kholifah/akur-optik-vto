declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader } from 'three'
  export class GLTFLoader extends Loader {
    load(url: string, onLoad: (gltf: unknown) => void, onProgress?: (ev: ProgressEvent) => void, onError?: (err: ErrorEvent) => void): void
    parse: (data: ArrayBuffer | string, path: string, onLoad: (gltf: unknown) => void, onError?: (err: ErrorEvent) => void) => void
  }
  export default GLTFLoader
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { EventDispatcher, MOUSE, TOUCH } from 'three'
  export class OrbitControls extends EventDispatcher {
    constructor(object: unknown, domElement?: HTMLElement)
    update: () => void
    dispose: () => void
    enableDamping: boolean
    enablePan: boolean
    minDistance: number
    maxDistance: number
    mouseButtons: typeof MOUSE
    touches: typeof TOUCH
  }
  export default OrbitControls
}
