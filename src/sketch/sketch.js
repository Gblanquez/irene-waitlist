import * as THREE from 'three'
import globalSceneManager from './sceneManager'

let sm = null

class SketchManager {
  constructor() {
    if (sm) return sm
    sm = this

    this.scene = null
    this.camera = null
    this.renderer = null
    this.canvas = null
    this.meshes = []
    this.isInitialized = false
    this.velocity = 0
    this.smoothVelocity = 0
  }

  init(container) {
    if (this.isInitialized) return

    this.container = container

    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = '100vw'
    this.canvas.style.height = '100vh'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '-10'
    document.body.appendChild(this.canvas)

    this.scene = new THREE.Scene()

    const w = window.innerWidth
    const h = window.innerHeight

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    })

    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    globalSceneManager.init(this.canvas, this.camera)
    globalSceneManager.updateMeshes()

    this.createMeshes()

    window.addEventListener('resize', () => this.resize())

    this.isInitialized = true
    this.animate()
  }

  createMeshes() {
    globalSceneManager.meshes.forEach((data) => {
      const geo = new THREE.PlaneGeometry(1, 1, 10, 10)
      const mesh = new THREE.Mesh(geo, data.material)

      this.scene.add(mesh)

      data.mesh = mesh
    })
  }

  setVelocity(v) {
    this.velocity = v
  }

  updateMeshPositions() {
    this.smoothVelocity += (this.velocity - this.smoothVelocity) * 0.1
    globalSceneManager.updateMeshPositions(this.camera, this.smoothVelocity)
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight

    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    this.updateMeshPositions()

    const t = performance.now() * 0.001

    globalSceneManager.meshes.forEach((m) => {
      if (m.material.uniforms.time) {
        m.material.uniforms.time.value = t
      }
    })

    this.renderer.render(this.scene, this.camera)
  }
}

export default new SketchManager()