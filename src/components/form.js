import Lenis from 'lenis'
import { gsap } from 'gsap'
import { lenis } from './scroll.js'

export default function formAnimation() {
  const formHolder = document.querySelector('.form-holder')
  const formContainer = document.querySelector('.form-content-parent')
  const ctas = document.querySelectorAll('.cta')
  const closeButton = document.querySelector('[data-a="close-form"]')

  let formLenis = null
  let formLenisTick = null

  gsap.set(formContainer, { yPercent: 110 })

  const openForm = () => {
    lenis.stop()

    formHolder.classList.add('is-open')

    gsap.set(formHolder, { opacity: 1, visibility: 'visible', pointerEvents: 'auto' })

    gsap.to(formContainer, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power3.out',
      onComplete: () => {
        if (!formLenis) {
          formLenis = new Lenis({
            wrapper: formHolder,
            content: formContainer,
            overscroll: false,
          })

          formLenisTick = (time) => formLenis?.raf(time * 1000)
          gsap.ticker.add(formLenisTick)
        }

        formLenis.resize()
      }
    })
  }

  const closeForm = () => {
    if (formLenis) {
      formLenis.destroy()
      formLenis = null
    }

    if (formLenisTick) {
      gsap.ticker.remove(formLenisTick)
      formLenisTick = null
    }

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
        lenis.start()
      }
    })
  }

  ctas.forEach((cta) => {
    cta.addEventListener('click', openForm)
  })

  closeButton?.addEventListener('click', closeForm)
}