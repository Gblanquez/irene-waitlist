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
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

export default class collabRender extends Renderer {
  constructor(...args) {
    super(...args)
    this.thumbnailsParent = null
    this.thumbnailsPlaceholder = null
    this.thumbnailsOriginalParent = null
    this.thumbnailsOriginalNextSibling = null
    this.thumbnailsDetached = false
    this.thumbnailLinks = []
    this.thumbnailItems = []
    this.thumbnailMark = null
    this.thumbnailMarkBaseX = 0
    this.thumbnailMarkBaseY = 0
    this.thumbnailMarkMoveX = null
    this.thumbnailMarkMoveY = null
    this.collabContents = []
    this.collabContentMap = new Map()
    this.collabContentPlaceholderMap = new Map()
    this.collabLinkHandlers = []
    this.collabHoverId = null
    this.activeCollabContentId = null
    this.collabContentSwitchTimeout = null
  }

  detachThumbnailsFromTaxiView() {
    const thumbnailsParent = document.querySelector('.thumbnails-parent')
    if (!thumbnailsParent) return null

    if (this.thumbnailsParent === thumbnailsParent && document.body.contains(thumbnailsParent)) {
      return thumbnailsParent
    }

    this.cleanupDetachedThumbnails()

    this.thumbnailsParent = thumbnailsParent
    this.thumbnailsOriginalParent = thumbnailsParent.parentNode
    this.thumbnailsOriginalNextSibling = thumbnailsParent.nextSibling
    this.thumbnailsPlaceholder = document.createComment('thumbnails-parent-placeholder')

    if (this.thumbnailsOriginalParent) {
      this.thumbnailsOriginalParent.insertBefore(this.thumbnailsPlaceholder, thumbnailsParent)
    }

    document.body.appendChild(thumbnailsParent)
    this.thumbnailsDetached = true
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
    this.thumbnailsDetached = false
  }

  cleanupDetachedThumbnails() {
    if (this.thumbnailsPlaceholder?.parentNode) {
      this.thumbnailsPlaceholder.parentNode.removeChild(this.thumbnailsPlaceholder)
    }

    if (this.thumbnailsParent?.parentNode === document.body) {
      this.thumbnailsParent.parentNode.removeChild(this.thumbnailsParent)
    }

    this.thumbnailsParent = null
    this.thumbnailsPlaceholder = null
    this.thumbnailsOriginalParent = null
    this.thumbnailsOriginalNextSibling = null
    this.thumbnailsDetached = false
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

  detachCollabContentsFromTaxiView() {
    const contentElements = Array.from(document.querySelectorAll('.collab-content'))
    if (!contentElements.length) return

    this.cleanupDetachedCollabContents()

    this.collabContents = contentElements
      .filter((element) => element.id)
      .map((element) => {
        const placeholder = document.createComment(`collab-content-placeholder-${element.id}`)
        const originalParent = element.parentNode
        const originalNextSibling = element.nextSibling

        if (originalParent) {
          originalParent.insertBefore(placeholder, element)
        }

        document.body.appendChild(element)
        element.classList.remove('hide')
        element.style.setProperty('position', 'fixed', 'important')
        element.style.pointerEvents = 'none'
        element.style.willChange = 'opacity, transform'

        return {
          id: element.id,
          element,
          placeholder,
          originalParent,
          originalNextSibling,
          splits: [],
          lines: [],
        }
      })

    this.collabContentMap = new Map(this.collabContents.map((item) => [item.id, item]))
  }

  cleanupDetachedCollabContents() {
    if (this.collabContentSwitchTimeout) {
      clearTimeout(this.collabContentSwitchTimeout)
      this.collabContentSwitchTimeout = null
    }

    this.collabLinkHandlers.forEach(({ link, enter, leave }) => {
      link.removeEventListener('mouseenter', enter)
      link.removeEventListener('mouseleave', leave)
    })
    this.collabLinkHandlers = []

    this.collabContents.forEach((content) => {
      content.splits.forEach((split) => {
        if (split && !split._isReverted) {
          split.revert()
          split._isReverted = true
        }
      })

      if (content.placeholder?.parentNode) {
        content.placeholder.parentNode.removeChild(content.placeholder)
      }

      if (content.element?.parentNode === document.body) {
        content.element.parentNode.removeChild(content.element)
      }
    })

    this.collabContents = []
    this.collabContentMap.clear()
    this.collabHoverId = null
    this.activeCollabContentId = null
  }

  prepareCollabContents() {
    this.collabContents.forEach((content) => {
      const textTargets = Array.from(content.element.querySelectorAll('.content-child'))
        .filter((element) => element.textContent?.trim())

      content.splits = textTargets.map((element) => {
        const split = SplitText.create(element, {
          type: 'lines',
          mask: 'lines',
        })

        split._isReverted = false
        return split
      })

      content.lines = content.splits.flatMap((split) => split.lines || [])

      gsap.set(content.element, { autoAlpha: 0 })
      gsap.set(content.lines, { yPercent: 100, opacity: 0 })
    })
  }

  getCenteredCollabId() {
    if (!this.thumbnailLinks.length) return null

    const viewportCenter = window.innerHeight * 0.5

    return this.thumbnailLinks.reduce((closest, link) => {
      if (!link.id) return closest

      const rect = link.getBoundingClientRect()
      const linkCenter = rect.top + (rect.height * 0.5)
      const distance = Math.abs(linkCenter - viewportCenter)

      if (distance < closest.distance) {
        return { id: link.id, distance }
      }

      return closest
    }, { id: this.thumbnailLinks[0]?.id || null, distance: Number.POSITIVE_INFINITY }).id
  }

  showCollabContentById(id, immediate = false) {
    if (!id || id === this.activeCollabContentId) return

    const nextContent = this.collabContentMap.get(id)
    if (!nextContent) return

    const previousContent = this.collabContentMap.get(this.activeCollabContentId)

    if (previousContent) {
      gsap.killTweensOf(previousContent.element)
      gsap.killTweensOf(previousContent.lines)
      gsap.to(previousContent.lines, {
        yPercent: -100,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        stagger: 0.02,
      })
      gsap.to(previousContent.element, {
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power2.out',
      })
    }

    gsap.killTweensOf(nextContent.element)
    gsap.killTweensOf(nextContent.lines)
    gsap.set(nextContent.element, { autoAlpha: 1 })

    if (immediate) {
      gsap.set(nextContent.lines, { yPercent: 0, opacity: 1 })
    } else {
      gsap.fromTo(nextContent.lines, {
        yPercent: 100,
        opacity: 0,
      }, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.04,
      })
    }

    this.activeCollabContentId = id
  }

  updateActiveCollabContent(immediate = false) {
    const nextId = this.collabHoverId || this.getCenteredCollabId()
    if (!nextId) return

    this.showCollabContentById(nextId, immediate)
  }

  scheduleScrollDrivenCollabContentUpdate(delay = 1) {
    if (this.collabHoverId) return

    if (this.collabContentSwitchTimeout) return

    this.collabContentSwitchTimeout = window.setTimeout(() => {
      this.updateActiveCollabContent()
      this.collabContentSwitchTimeout = null
    }, delay)
  }

  setupCollabContentSync() {
    this.detachCollabContentsFromTaxiView()
    if (!this.collabContents.length) return

    this.prepareCollabContents()

    this.thumbnailLinks.forEach((link) => {
      if (!link.id) return

      const enter = () => {
        if (this.collabContentSwitchTimeout) {
          clearTimeout(this.collabContentSwitchTimeout)
          this.collabContentSwitchTimeout = null
        }

        this.collabHoverId = link.id
        this.updateActiveCollabContent()
      }

      const leave = () => {
        this.collabHoverId = null
        this.scheduleScrollDrivenCollabContentUpdate(1)
      }

      link.addEventListener('mouseenter', enter)
      link.addEventListener('mouseleave', leave)
      this.collabLinkHandlers.push({ link, enter, leave })
    })

    this.updateActiveCollabContent(true)
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
    this.setupCollabContentSync()

    setOnScrollUpdate(({ velocity, progress }) => {
      SketchManager.setVelocity(velocity)

      if (Math.abs(velocity) > 0.01) {
        this.collabHoverId = null
        if (this.collabContentSwitchTimeout) {
          clearTimeout(this.collabContentSwitchTimeout)
          this.collabContentSwitchTimeout = null
        }
      } else {
        this.scheduleScrollDrivenCollabContentUpdate()
      }

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
    if (this.collabContentSwitchTimeout) {
      clearTimeout(this.collabContentSwitchTimeout)
      this.collabContentSwitchTimeout = null
    }
    if (this.thumbnailMark) {
      gsap.killTweensOf(this.thumbnailMark)
    }
  }

  onLeaveCompleted()
  {
    this.cleanupDetachedThumbnails()
    this.cleanupDetachedCollabContents()
  }
}
