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
    this.loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)
    this.textureLoader.setCrossOrigin('anonymous')
    this.textureEntries = new Map()
    this.videoEntries = new Map()

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

  getTextureEntry(src) {
    if (this.textureEntries.has(src)) return this.textureEntries.get(src)

    const material = this.makeMaterial(this.makeUniforms(null, 1, 1))
    const entry = {
      material,
      status: 'loading',
      promise: null,
    }

    entry.promise = new Promise((resolve) => {
      this.textureLoader.load(src, (texture) => {
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false

        material.uniforms.uTexture.value = texture
        material.uniforms.uTextureSize.value.set(texture.image.width, texture.image.height)
        entry.status = 'loaded'
        resolve(material)
      }, undefined, () => {
        entry.status = 'error'
        resolve(material)
      })
    })

    this.textureEntries.set(src, entry)
    this.materials.set(src, material)
    return entry
  }

  createMaterial(src) {
    return this.getTextureEntry(src).material
  }

  getVideoEntry(src) {
    if (this.videoEntries.has(src)) return this.videoEntries.get(src)

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
    const entry = {
      material,
      video,
      status: 'loading',
      promise: null,
    }

    entry.promise = new Promise((resolve) => {
      const complete = () => {
        const texture = new THREE.VideoTexture(video)

        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        texture.format = THREE.RGBAFormat

        material.uniforms.uTexture.value = texture
        material.uniforms.uTextureSize.value.set(video.videoWidth || 1920, video.videoHeight || 1080)
        entry.status = 'loaded'
        resolve(material)
      }

      video.addEventListener('loadeddata', complete, { once: true })
      video.addEventListener('error', () => {
        entry.status = 'error'
        resolve(material)
      }, { once: true })
    })

    this.videoEntries.set(src, entry)
    this.materials.set(src, material)
    return entry
  }

  createVideoMaterial(src) {
    return this.getVideoEntry(src).material
  }

  resolveAssetUrl(src, baseUrl = window.location.href) {
    try {
      return new URL(src, baseUrl).href
    } catch {
      return src
    }
  }

  collectMeshAssets(root = document, baseUrl = window.location.href) {
    const wraps = Array.from(root.querySelectorAll('.img-wrap'))
    const assetMap = new Map()

    wraps.forEach((wrap) => {
      const videoSrc = wrap.getAttribute('data-video-src')
      const img = wrap.querySelector('.img')

      if (videoSrc) {
        const src = this.resolveAssetUrl(videoSrc, baseUrl)
        assetMap.set(`video:${src}`, { type: 'video', src })
        return
      }

      const imageSrc = img?.getAttribute('src')
      if (!imageSrc) return

      const src = this.resolveAssetUrl(imageSrc, baseUrl)
      assetMap.set(`image:${src}`, { type: 'image', src })
    })

    return Array.from(assetMap.values())
  }

  preloadAssetDescriptors(assets = [], onProgress) {
    const total = assets.length
    if (!total) {
      onProgress?.(1, 0, 0)
      return Promise.resolve()
    }

    let loaded = 0
    onProgress?.(0, 0, total)

    const markLoaded = () => {
      loaded += 1
      onProgress?.(loaded / total, loaded, total)
    }

    return Promise.all(assets.map((asset) => {
      const entry = asset.type === 'video'
        ? this.getVideoEntry(asset.src)
        : this.getTextureEntry(asset.src)

      return entry.promise.finally(markLoaded)
    }))
  }

  preloadMeshes(root = document, onProgress, baseUrl = window.location.href) {
    const assets = this.collectMeshAssets(root, baseUrl)
    return this.preloadAssetDescriptors(assets, onProgress)
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
