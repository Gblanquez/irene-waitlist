import gsap from 'gsap'

let loaderInstance = null

class LoadManager {
  constructor() {
    if (loaderInstance) return loaderInstance

    this.overlay = null
    this.label = null
    this.progressValue = { value: 0 }
    this.hasCompletedInitialLoad = false
    this.prefetchedUrls = new Set()

    loaderInstance = this
  }

  ensureOverlay() {
    this.overlay = document.querySelector('.load-parent')
    this.label = document.querySelector('[data-a="load-text"]')

    if (!this.overlay || !this.label) {
      this.overlay = null
      this.label = null
    }
  }

  updateProgress(progress) {
    const target = Math.round(progress * 100)

    gsap.to(this.progressValue, {
      value: target,
      duration: 0.2,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        if (this.label) {
          this.label.textContent = `${Math.round(this.progressValue.value)}`
        }
      },
    })
  }

  getTaxiPrefetchUrls() {
    return Array.from(document.querySelectorAll('a[href]'))
      .map((link) => link.getAttribute('href'))
      .filter(Boolean)
      .map((href) => {
        try {
          return new URL(href, window.location.href)
        } catch {
          return null
        }
      })
      .filter((url) => {
        if (!url) return false
        if (url.origin !== window.location.origin) return false
        if (url.pathname === window.location.pathname && url.search === window.location.search) return false
        if (url.hash) return false
        return true
      })
      .map((url) => url.href)
  }

  async prefetchRoute(url) {
    if (this.prefetchedUrls.has(url)) return
    this.prefetchedUrls.add(url)

    try {
      const response = await fetch(url, { credentials: 'same-origin' })
      if (!response.ok) return

      const html = await response.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      await this.preloadImages(doc, undefined, url)
    } catch {
      this.prefetchedUrls.delete(url)
    }
  }

  prefetchRoutesInBackground() {
    const run = () => {
      const urls = this.getTaxiPrefetchUrls()
      urls.forEach((url) => {
        this.prefetchRoute(url)
      })
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 1500 })
      return
    }

    window.setTimeout(run, 300)
  }

  collectImageUrls(root = document, baseUrl = window.location.href) {
    const images = Array.from(root.querySelectorAll('.img'))
    const urls = new Map()

    images.forEach((img) => {
      const src = img.getAttribute('src')
      if (!src) return

      try {
        const absoluteUrl = new URL(src, baseUrl).href
        urls.set(absoluteUrl, absoluteUrl)
      } catch {
        urls.set(src, src)
      }
    })

    return Array.from(urls.values())
  }

  preloadImages(root = document, onProgress, baseUrl = window.location.href) {
    const imageUrls = this.collectImageUrls(root, baseUrl)
    const total = imageUrls.length

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

    return Promise.all(imageUrls.map((url) => new Promise((resolve) => {
      const image = new Image()
      image.decoding = 'async'
      image.onload = () => {
        markLoaded()
        resolve()
      }
      image.onerror = () => {
        markLoaded()
        resolve()
      }
      image.src = url

      if (image.complete) {
        markLoaded()
        resolve()
      }
    })))
  }

  async runInitialLoad(pageWrapper) {
    if (this.hasCompletedInitialLoad) return

    this.ensureOverlay()

    if (pageWrapper) {
      gsap.set(pageWrapper, { opacity: 0 })
    }

    if (this.overlay) {
      this.overlay.style.setProperty('display', 'flex', 'important')
      gsap.set(this.overlay, { autoAlpha: 1 })
    }

    if (this.label) {
      gsap.set(this.label, { yPercent: 0, opacity: 1 })
    }

    this.progressValue.value = 0
    if (this.label) {
      this.label.textContent = '0'
    }

    await this.preloadImages(document, (progress) => {
      this.updateProgress(progress)
    })

    this.updateProgress(1)

    await new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve })

      if (this.label) {
        tl.to(this.label, {
          yPercent: -100,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.inOut',
        })
      }

      if (pageWrapper) {
        tl.to(pageWrapper, {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
        }, this.label ? 0.1 : 0)
      }

      if (this.overlay) {
        tl.set(this.overlay, {
          autoAlpha: 0,
        })
      }
    })

    if (this.overlay) {
      this.overlay.style.setProperty('display', 'none', 'important')
    }

    this.hasCompletedInitialLoad = true
    this.prefetchRoutesInBackground()
  }
}

export default new LoadManager()
