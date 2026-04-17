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

export default class collabRender extends Renderer {
  constructor(...args) {
    super(...args)
    this.thumbnailsParent = null
    this.thumbnailsPlaceholder = null
    this.thumbnailsOriginalParent = null
    this.thumbnailsOriginalNextSibling = null
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

  updateThumbnails(progress = 0) {
    const thumbnailsParent = this.enforceThumbnailsFixed()
    if (!thumbnailsParent) return

    const y = -progress * window.innerWidth * 0.5
    thumbnailsParent.style.transform = `translate3d(0, ${y}px, 0)`
  }

  setupScrollHandlers() {
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
    this.restoreThumbnailsToView()
  }

  onLeaveCompleted()
  {
    this.restoreThumbnailsToView()
  }
}
