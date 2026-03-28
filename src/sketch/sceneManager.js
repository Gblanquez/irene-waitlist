import * as THREE from 'three'
import { fragmentShader } from './shaders/fragment.js'
import { vertexShader } from './shaders/vertex.js'

let sceneInstance = null

class SceneManager {
  constructor() {
    if (sceneInstance) return sceneInstance

    this.camera = null
    this.materials = new Map()
    this.meshes = []
    this.isInitialized = false
    this.textureLoader = new THREE.TextureLoader()

    sceneInstance = this
  }

  init(canvasElement, camera) {
    this.camera = camera
    this.isInitialized = true
  }

  makeUniforms(texture, w, h) {
    return {
      uTexture: { value: texture },
      uTextureSize: { value: new THREE.Vector2(w, h) },
      uOpacity: { value: 1 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uQuadSize: { value: new THREE.Vector2(1, 1) },
      time: { value: 0 }
    }
  }

  makeMaterial(uniforms) {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms
    })
  }

  createMaterial(src) {
    if (this.materials.has(src)) return this.materials.get(src)

    const material = this.makeMaterial(this.makeUniforms(null, 1, 1))

    this.textureLoader.setCrossOrigin('anonymous')

    this.textureLoader.load(src, (texture) => {
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false

      material.uniforms.uTexture.value = texture
      material.uniforms.uTextureSize.value.set(texture.image.width, texture.image.height)
    })

    this.materials.set(src, material)
    return material
  }

  createVideoMaterial(src) {
    if (this.materials.has(src)) return this.materials.get(src)

    const video = document.createElement('video')


    video.crossOrigin = 'anonymous'

    video.src = src
    video.muted = true
    video.loop = true
    video.autoplay = true
    video.playsInline = true
    video.setAttribute('playsinline', '')

    video.style.position = 'fixed'
    video.style.top = '0'
    video.style.left = '0'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'

    document.body.appendChild(video)

    video.play().catch(() => {})

    const material = this.makeMaterial(this.makeUniforms(null, 1920, 1080))

    video.addEventListener('loadeddata', () => {
      const texture = new THREE.VideoTexture(video)


      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.format = THREE.RGBAFormat

      material.uniforms.uTexture.value = texture
      material.uniforms.uTextureSize.value.set(video.videoWidth, video.videoHeight)
    }, { once: true })

    this.materials.set(src, material)
    return material
  }

  updateMeshes() {
    const wraps = document.querySelectorAll(".img-wrap")
    this.meshes = []

    wraps.forEach((wrap, i) => {
      const videoSrc = wrap.getAttribute('data-video-src')
      const img = wrap.querySelector('.img')

      let material

      if (videoSrc) {
        material = this.createVideoMaterial(videoSrc)
      } else if (img) {
        material = this.createMaterial(img.src)
      } else {
        return
      }

      this.meshes.push({
        element: wrap,
        material,
        mesh: null
      })
    })
  }

  updateMeshPositions(camera, velocity = 0) {
    const width = window.innerWidth
    const height = window.innerHeight

    const fov = camera.fov * (Math.PI / 180)
    const dist = camera.position.z
    const viewportHeight = 2 * Math.tan(fov / 2) * dist
    const viewportWidth = viewportHeight * (width / height)

    const tilt = Math.max(-0.4, Math.min(0.2, velocity * 0.002))

    this.meshes.forEach((m) => {
      if (!m.mesh) return

      const rect = m.element.getBoundingClientRect()

      const scaleX = (rect.width / width) * viewportWidth
      const scaleY = (rect.height / height) * viewportHeight

      const posX = ((rect.left + rect.width / 2) / width - 0.5) * viewportWidth
      const posY = -((rect.top + rect.height / 2) / height - 0.5) * viewportHeight

      m.mesh.position.set(posX, posY, 0)
      m.mesh.scale.set(scaleX, scaleY, 1)
      m.mesh.rotation.x = tilt

      m.material.uniforms.uQuadSize.value.set(scaleX, scaleY)
      m.material.uniforms.uResolution.value.set(width, height)
    })
  }
}

export default new SceneManager()