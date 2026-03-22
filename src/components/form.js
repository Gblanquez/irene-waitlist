import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenis } from "./scroll.js";
gsap.registerPlugin(ScrollTrigger);

export default function formAnimation() {
  const formHolder = document.querySelector('.form-holder')
  const formContainer = document.querySelector('.form-container')
  const ctas = document.querySelectorAll('.cta')

  gsap.set(formContainer, { y: '110%' })

  ctas.forEach(cta => {
    cta.addEventListener('click', () => {
      lenis.stop()
      formHolder.classList.add('flex')
      gsap.to(formContainer, { y: '0%', duration: 1.1, ease: 'power3.out' })
    })
  })
}

