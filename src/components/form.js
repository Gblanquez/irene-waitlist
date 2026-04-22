import Lenis from 'lenis'
import { gsap } from 'gsap'
import { lenis } from './scroll.js'

let formLenis = null
let formLenisTick = null
let activeFormHolder = null
let formPlaceholder = null
let formOriginalParent = null
let formOriginalNextSibling = null

function detachFormHolder(formHolder) {
  if (!formHolder || activeFormHolder === formHolder) return

  restoreFormHolder()

  formOriginalParent = formHolder.parentNode
  formOriginalNextSibling = formHolder.nextSibling
  formPlaceholder = document.createComment('form-holder-placeholder')

  if (formOriginalParent) {
    formOriginalParent.insertBefore(formPlaceholder, formHolder)
  }

  document.body.appendChild(formHolder)
  activeFormHolder = formHolder
}

function restoreFormHolder() {
  if (!activeFormHolder || !formOriginalParent) return

  if (formOriginalNextSibling && formOriginalNextSibling.parentNode === formOriginalParent) {
    formOriginalParent.insertBefore(activeFormHolder, formOriginalNextSibling)
  } else if (formPlaceholder?.parentNode === formOriginalParent) {
    formOriginalParent.insertBefore(activeFormHolder, formPlaceholder)
  } else {
    formOriginalParent.appendChild(activeFormHolder)
  }

  if (formPlaceholder?.parentNode) {
    formPlaceholder.parentNode.removeChild(formPlaceholder)
  }

  activeFormHolder = null
  formPlaceholder = null
  formOriginalParent = null
  formOriginalNextSibling = null
}

function destroyFormLenis() {
  if (formLenis) {
    formLenis.destroy()
    formLenis = null
  }

  if (formLenisTick) {
    gsap.ticker.remove(formLenisTick)
    formLenisTick = null
  }
}

export default function formAnimation() {
  const formHolder = document.querySelector('.form-holder')
  const formContainer = document.querySelector('.form-content-parent')
  const ctas = document.querySelectorAll('[data-a="form"]')
  const closeButton = document.querySelector('[data-a="close-form"]')

  if (!formHolder || !formContainer) return

  if (!formHolder.classList.contains('is-open')) {
    gsap.set(formContainer, { yPercent: 110 })
  }

  const openForm = () => {
    detachFormHolder(formHolder)
    destroyFormLenis()
    gsap.killTweensOf(formContainer)
    gsap.killTweensOf(formHolder)

    lenis.stop()

    formHolder.classList.add('is-open')
    gsap.set(formHolder, {
      opacity: 1,
      visibility: 'visible',
      pointerEvents: 'auto',
      position: 'fixed',
    })

    gsap.to(formContainer, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power3.out',
      onComplete: () => {
        formLenis = new Lenis({
          wrapper: formHolder,
          content: formContainer,
          overscroll: false,
        })

        formLenis.scrollTo(0, { immediate: true })
        formLenisTick = (time) => formLenis?.raf(time * 1000)
        gsap.ticker.add(formLenisTick)
        formLenis.resize()
      }
    })
  }

  const closeForm = () => {
    destroyFormLenis()
    gsap.killTweensOf(formContainer)

    gsap.to(formContainer, {
      yPercent: 110,
      duration: 1.1,
      ease: 'power3.inOut',
      onComplete: () => {
        formHolder.classList.remove('is-open')
        gsap.set(formHolder, {
          opacity: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
        })
        restoreFormHolder()
        lenis.start()
      }
    })
  }

  ctas.forEach((cta) => {
    if (cta.dataset.formBound === 'true') return

    cta.dataset.formBound = 'true'
    cta.addEventListener('click', openForm)
  })

  if (closeButton && closeButton.dataset.formBound !== 'true') {
    closeButton.dataset.formBound = 'true'
    closeButton.addEventListener('click', closeForm)
  }
}
