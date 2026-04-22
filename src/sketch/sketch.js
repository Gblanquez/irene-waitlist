import * as THREE from 'three'
import gsap from 'gsap'
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
    this.viewportWidth = window.innerWidth
    this.viewportHeight = window.innerHeight
    this.resizeTimeout = null
    this.handleResize = this.handleResize.bind(this)
  }

  getViewportSize() {
    const viewport = window.visualViewport

    return {
      width: Math.round(viewport?.width || window.innerWidth),
      height: Math.round(viewport?.height || window.innerHeight),
    }
  }

  isMobileViewport() {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768
  }

  applyResize(width, height) {
    if (!this.camera || !this.renderer) return

    this.viewportWidth = width
    this.viewportHeight = height

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobileViewport() ? 1.5 : 2))
    globalSceneManager.setViewportSize(width, height)
  }

  handleResize() {
    const { width, height } = this.getViewportSize()
    const widthDelta = Math.abs(width - this.viewportWidth)

    if (!this.isMobileViewport() || widthDelta > 80) {
      clearTimeout(this.resizeTimeout)
      this.applyResize(width, height)
      return
    }

    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = window.setTimeout(() => {
      this.applyResize(width, height)
    }, 180)
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

    const { width: w, height: h } = this.getViewportSize()
    this.viewportWidth = w
    this.viewportHeight = h

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    })

    this.renderer.setSize(w, h, false)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobileViewport() ? 1.5 : 2))

    globalSceneManager.init(this.canvas, this.camera)
    globalSceneManager.setViewportSize(w, h)
    globalSceneManager.updateMeshes()

    this.createMeshes()

    window.addEventListener('resize', this.handleResize)
    window.visualViewport?.addEventListener('resize', this.handleResize)

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

  refreshMeshes() {
    globalSceneManager.meshes.forEach((m) => {
      if (m.mesh) this.scene.remove(m.mesh)
    })

    globalSceneManager.updateMeshes()
    this.createMeshes()
  }

  revealMeshes({ duration = 1, ease = 'power3.out', stagger = 0.1, delay = 0 } = {}) {
    globalSceneManager.meshes.forEach((m, i) => {
      m.material.uniforms.uOpacity.value = 0
      gsap.to(m.material.uniforms.uOpacity, {
        value: 1,
        duration,
        ease,
        delay: delay + i * stagger,
      })
    })
  }

  hideMeshes({ duration = 0.6, ease = 'power3.in' } = {}) {
    globalSceneManager.meshes.forEach((m) => {
      gsap.to(m.material.uniforms.uOpacity, {
        value: 0,
        duration,
        ease,
      })
    })
  }

  setVelocity(v) {
    this.velocity = v
  }

  updateMeshPositions() {
    this.smoothVelocity += (this.velocity - this.smoothVelocity) * 0.1
    globalSceneManager.updateMeshPositions(this.camera, this.smoothVelocity)
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
