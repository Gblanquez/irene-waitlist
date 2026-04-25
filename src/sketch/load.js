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
      duration: 0.28,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        if (this.label) {
          this.label.textContent = `${Math.round(this.progressValue.value)}`
        }
      },
    })
  }

  waitMinimumDuration(duration = 1800) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, duration)
    })
  }

  waitForWindowLoad() {
    if (document.readyState === 'complete') {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      window.addEventListener('load', () => resolve(), { once: true })
    })
  }

  waitForFonts() {
    if (document.fonts?.ready) {
      return document.fonts.ready.catch(() => undefined)
    }

    return Promise.resolve()
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
      await this.preloadAssets(doc, undefined, url)
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

  collectVideoUrls(root = document, baseUrl = window.location.href) {
    const wraps = Array.from(root.querySelectorAll('.img-wrap'))
    const urls = new Map()

    wraps.forEach((wrap) => {
      const src = wrap.getAttribute('data-video-src')
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

  preloadAssets(root = document, onProgress, baseUrl = window.location.href) {
    const assets = [
      ...this.collectImageUrls(root, baseUrl).map((src) => ({ type: 'image', src })),
      ...this.collectVideoUrls(root, baseUrl).map((src) => ({ type: 'video', src })),
    ]
    const readinessTasks = [
      { type: 'font-ready' },
      { type: 'window-load' },
    ]
    const total = assets.length + readinessTasks.length

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

    const assetPromises = assets.map((asset) => {
      if (asset.type === 'video') {
        return new Promise((resolve) => {
          const video = document.createElement('video')
          let settled = false

          const complete = () => {
            if (settled) return
            settled = true
            markLoaded()
            resolve()
          }

          video.preload = 'auto'
          video.muted = true
          video.playsInline = true
          video.crossOrigin = 'anonymous'
          video.addEventListener('canplaythrough', complete, { once: true })
          video.addEventListener('error', complete, { once: true })
          video.src = asset.src
          video.load()

          if (video.readyState >= 4) {
            complete()
            return
          }

          window.setTimeout(complete, 12000)
        })
      }

      return new Promise((resolve) => {
        const image = new Image()
        let settled = false

        const complete = () => {
          if (settled) return
          settled = true
          markLoaded()
          resolve()
        }

        image.decoding = 'async'
        image.onload = complete
        image.onerror = complete
        image.src = asset.src

        if (image.complete) {
          complete()
        }
      })
    })

    const readinessPromises = readinessTasks.map((task) => {
      if (task.type === 'font-ready') {
        return this.waitForFonts().finally(markLoaded)
      }

      return this.waitForWindowLoad().finally(markLoaded)
    })

    return Promise.all([...assetPromises, ...readinessPromises])
  }

  async runInitialLoad(pageWrapper, onBeforeReveal) {
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

    await Promise.all([
      this.preloadAssets(document, (progress) => {
        this.updateProgress(progress)
      }),
      this.waitMinimumDuration(1800),
    ])

    this.updateProgress(1)

    if (onBeforeReveal) {
      await onBeforeReveal()
    }

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
          duration: 1.1,
          ease: 'power3.out',
        }, this.label ? 0.25 : 0)
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
