import { Renderer } from '@unseenco/taxi';
import { lenis, startRAF, stopRAF, setOnScrollUpdate } from '../components/scroll.js'
import { initScaling } from '../components/scaling.js'
import globalLinesReveal from '../components/lines.js'
import globalVerticalLinesReveal from '../components/vertical-lines.js'
import formAnimation from '../components/form.js'
import bodyTextReveal from '../components/bodyText.js'
import titleTextReveal from '../components/titleText.js'
import labelTextReveal from '../components/labelText.js'
import globalLinkHover from '../components/linksHover.js'
import globalLinkPageHover from '../components/globalLinks.js'
import collabLinkPageHover from '../components/collaboratorLink.js'
import SketchManager from '../sketch/sketch.js'
import gsap from 'gsap'

export default class collabRender extends Renderer {
  constructor(...args) {
    super(...args)
    this.thumbnailsParent = null
    this.thumbnailsPlaceholder = null
    this.thumbnailsOriginalParent = null
    this.thumbnailsOriginalNextSibling = null
    this.thumbnailLinks = []
    this.thumbnailItems = []
    this.thumbnailMark = null
    this.thumbnailMarkBaseX = 0
    this.thumbnailMarkBaseY = 0
    this.thumbnailMarkMoveX = null
    this.thumbnailMarkMoveY = null
  }

  detachThumbnailsFromTaxiView() {
    const thumbnailsParent = document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent) return null

    if (this.thumbnailsParent === thumbnailsParent && document.body.contains(thumbnailsParent)) {
      return thumbnailsParent
    }

    this.restoreThumbnailsToView()

    this.thumbnailsParent = thumbnailsParent
    this.thumbnailsOriginalParent = thumbnailsParent.parentNode
    this.thumbnailsOriginalNextSibling = thumbnailsParent.nextSibling
    this.thumbnailsPlaceholder = document.createComment('thumbnails-parent-placeholder')

    if (this.thumbnailsOriginalParent) {
      this.thumbnailsOriginalParent.insertBefore(this.thumbnailsPlaceholder, thumbnailsParent)
    }

    document.body.appendChild(thumbnailsParent)
    return thumbnailsParent
  }

  restoreThumbnailsToView() {
    if (!this.thumbnailsParent || !this.thumbnailsOriginalParent) return

    if (this.thumbnailsOriginalNextSibling && this.thumbnailsOriginalNextSibling.parentNode === this.thumbnailsOriginalParent) {
      this.thumbnailsOriginalParent.insertBefore(this.thumbnailsParent, this.thumbnailsOriginalNextSibling)
    } else if (this.thumbnailsPlaceholder?.parentNode === this.thumbnailsOriginalParent) {
      this.thumbnailsOriginalParent.insertBefore(this.thumbnailsParent, this.thumbnailsPlaceholder)
    } else {
      this.thumbnailsOriginalParent.appendChild(this.thumbnailsParent)
    }

    if (this.thumbnailsPlaceholder?.parentNode) {
      this.thumbnailsPlaceholder.parentNode.removeChild(this.thumbnailsPlaceholder)
    }

    this.thumbnailsParent = null
    this.thumbnailsPlaceholder = null
    this.thumbnailsOriginalParent = null
    this.thumbnailsOriginalNextSibling = null
  }

  enforceThumbnailsFixed() {
    const thumbnailsParent = this.detachThumbnailsFromTaxiView() || document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent) return null

    thumbnailsParent.style.setProperty('position', 'fixed', 'important')
    thumbnailsParent.style.setProperty('will-change', 'transform')
    return thumbnailsParent
  }

  getThumbnailItems() {
    const thumbnailsParent = this.thumbnailsParent || document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent) return []

    const thumbnailMark = thumbnailsParent.querySelector('.thumbnail-mark') || document.querySelector('.thumbnail-mark')
    if (!thumbnailMark) return []

    if (thumbnailMark.parentElement && thumbnailMark.parentElement !== thumbnailsParent) {
      return Array.from(thumbnailMark.parentElement.parentElement?.children || [])
        .filter((element) => element.nodeType === 1)
    }

    return Array.from(thumbnailsParent.children)
      .filter((element) => element.nodeType === 1 && !element.classList.contains('thumbnail-mark'))
  }

  setupThumbnailSync() {
    this.thumbnailLinks = Array.from(document.querySelectorAll('.collab-link'))
    this.thumbnailMark = document.querySelector('.thumbnail-mark')
    this.thumbnailItems = this.getThumbnailItems()

    if (!this.thumbnailMark || !this.thumbnailItems.length) return

    const thumbnailsParent = this.thumbnailsParent || document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent) return

    const parentRect = thumbnailsParent.getBoundingClientRect()
    const markRect = this.thumbnailMark.getBoundingClientRect()

    this.thumbnailMarkBaseX = markRect.left - parentRect.left
    this.thumbnailMarkBaseY = markRect.top - parentRect.top
    this.thumbnailMarkMoveX = gsap.quickTo(this.thumbnailMark, 'x', {
      duration: 0.45,
      ease: 'power3.out',
    })
    this.thumbnailMarkMoveY = gsap.quickTo(this.thumbnailMark, 'y', {
      duration: 0.45,
      ease: 'power3.out',
    })

    this.updateActiveThumbnail()
  }

  updateActiveThumbnail() {
    if (!this.thumbnailLinks.length || !this.thumbnailItems.length || !this.thumbnailMark) return

    const viewportCenter = window.innerHeight * 0.5
    const thumbnailsParent = this.thumbnailsParent || document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent || !this.thumbnailMarkMoveX || !this.thumbnailMarkMoveY) return

    const parentRect = thumbnailsParent.getBoundingClientRect()
    const markRect = this.thumbnailMark.getBoundingClientRect()
    const linkCenters = this.thumbnailLinks.map((link) => {
      const rect = link.getBoundingClientRect()
      return rect.top + (rect.height * 0.5)
    })
    const thumbnailCenters = this.thumbnailItems.map((thumbnail) => {
      const rect = thumbnail.getBoundingClientRect()
      return {
        x: (rect.left - parentRect.left) + (rect.width * 0.5),
        y: (rect.top - parentRect.top) + (rect.height * 0.5),
      }
    })

    if (!linkCenters.length || !thumbnailCenters.length) return

    let targetCenter = thumbnailCenters[0]

    if (viewportCenter <= linkCenters[0]) {
      targetCenter = thumbnailCenters[0]
    } else if (viewportCenter >= linkCenters[linkCenters.length - 1]) {
      targetCenter = thumbnailCenters[thumbnailCenters.length - 1]
    } else {
      for (let index = 0; index < linkCenters.length - 1; index += 1) {
        const startLinkCenter = linkCenters[index]
        const endLinkCenter = linkCenters[index + 1]

        if (viewportCenter < startLinkCenter || viewportCenter > endLinkCenter) continue

        const range = endLinkCenter - startLinkCenter || 1
        const progress = (viewportCenter - startLinkCenter) / range
        const startThumbnailCenter = thumbnailCenters[index]
        const endThumbnailCenter = thumbnailCenters[index + 1]

        targetCenter = {
          x: startThumbnailCenter.x + ((endThumbnailCenter.x - startThumbnailCenter.x) * progress),
          y: startThumbnailCenter.y + ((endThumbnailCenter.y - startThumbnailCenter.y) * progress),
        }
        break
      }
    }

    const targetX = targetCenter.x - (markRect.width * 0.5)
    const targetY = targetCenter.y - (markRect.height * 0.5)

    this.thumbnailMarkMoveX(targetX - this.thumbnailMarkBaseX)
    this.thumbnailMarkMoveY(targetY - this.thumbnailMarkBaseY)
  }

  updateThumbnails(progress = 0) {
    const thumbnailsParent = this.enforceThumbnailsFixed()
    if (!thumbnailsParent) return

    const y = -progress * window.innerWidth * 0.5
    thumbnailsParent.style.transform = `translate3d(0, ${y}px, 0)`
    this.updateActiveThumbnail()
  }

  setupScrollHandlers() {
    this.setupThumbnailSync()

    setOnScrollUpdate(({ velocity, progress }) => {
      SketchManager.setVelocity(velocity)
      this.updateThumbnails(progress)
    })

    this.updateThumbnails(lenis.progress || 0)
  }

  runPageSetup() {
    initScaling()
    SketchManager.refreshMeshes()
    SketchManager.revealMeshes()

    globalVerticalLinesReveal()
    globalLinesReveal()
    // formAnimation()
    bodyTextReveal()
    globalLinkHover()
    labelTextReveal()
    titleTextReveal()
    globalLinkPageHover()
    collabLinkPageHover()
  }

  initialLoad() {
    startRAF()

    const container = document.querySelector('.page-wrapper')
    if (container) {
      SketchManager.init(container)
    }

    this.setupScrollHandlers()
    this.runPageSetup()
  }

  onEnter() {
    startRAF()
    this.setupScrollHandlers()
    this.runPageSetup()
  }

  onEnterCompleted() {
    this.setupScrollHandlers()
    requestAnimationFrame(() => this.setupScrollHandlers())
  }

  onLeave() {
    stopRAF()
    if (this.thumbnailMark) {
      gsap.killTweensOf(this.thumbnailMark)
      gsap.set(this.thumbnailMark, { x: 0, y: 0 })
    }
    this.restoreThumbnailsToView()
  }

  onLeaveCompleted()
  {
    this.restoreThumbnailsToView()
  }
}
