import Lenis from 'lenis'
import { gsap } from "gsap";
import { lenis } from "./scroll.js";

export default function formAnimation() {
  const formHolder = document.querySelector('.form-holder')
  const formContainer = document.querySelector('.form-container')
  const ctas = document.querySelectorAll('.cta')

  let formLenis = null

  gsap.set(formContainer, { y: '110%' })

  ctas.forEach(cta => {
    cta.addEventListener('click', () => {
      lenis.stop()
      formHolder.classList.add('flex')

      gsap.to(formContainer, {
        y: '0%', duration: 1.1, ease: 'power3.out',
        onComplete: () => {
          formLenis = new Lenis({
            wrapper: formHolder,
            content: formHolder.children[0],
            overscroll: false,
          })
          gsap.ticker.add((time) => formLenis?.raf(time * 1000))
        }
      })
    })
  })
}

