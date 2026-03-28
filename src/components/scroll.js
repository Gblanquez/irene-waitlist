import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let rafId = null

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
  overscroll: false,
  autoRaf: false,
})

let onScrollUpdate = () => {}

function customRAF(time) {
  rafId = requestAnimationFrame(customRAF)

  lenis.raf(time)

  onScrollUpdate({
    scroll: lenis.scroll,
    velocity: lenis.velocity,
    progress: lenis.progress,
    time
  })
}

function setOnScrollUpdate(cb) {
  onScrollUpdate = cb
}

function startRAF() {
  if (!rafId) {
    rafId = requestAnimationFrame(customRAF)
  }
}

function stopRAF() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

export { lenis, startRAF, stopRAF, setOnScrollUpdate }

startRAF()