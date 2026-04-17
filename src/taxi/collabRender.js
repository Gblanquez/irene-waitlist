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
    this.activeThumbnailIndex = -1
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
    this.activeThumbnailIndex = -1

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

    const closestIndex = this.thumbnailLinks.reduce((closest, link, index) => {
      const rect = link.getBoundingClientRect()
      const linkCenter = rect.top + (rect.height * 0.5)
      const distance = Math.abs(linkCenter - viewportCenter)

      if (distance < closest.distance) {
        return { index, distance }
      }

      return closest
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index

    if (closestIndex === this.activeThumbnailIndex) return

    const targetThumbnail = this.thumbnailItems[closestIndex]
    if (!targetThumbnail) return

    const thumbnailsParent = this.thumbnailsParent || document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent || !this.thumbnailMarkMoveX || !this.thumbnailMarkMoveY) return

    const parentRect = thumbnailsParent.getBoundingClientRect()
    const thumbnailRect = targetThumbnail.getBoundingClientRect()
    const markRect = this.thumbnailMark.getBoundingClientRect()

    const targetX = (thumbnailRect.left - parentRect.left) + (thumbnailRect.width * 0.5) - (markRect.width * 0.5)
    const targetY = (thumbnailRect.top - parentRect.top) + (thumbnailRect.height * 0.5) - (markRect.height * 0.5)

    this.thumbnailMarkMoveX(targetX - this.thumbnailMarkBaseX)
    this.thumbnailMarkMoveY(targetY - this.thumbnailMarkBaseY)
    this.activeThumbnailIndex = closestIndex
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
    formAnimation()
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
