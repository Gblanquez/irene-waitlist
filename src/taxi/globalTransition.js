import { Transition } from "@unseenco/taxi";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { lenis } from '../components/scroll.js'

gsap.registerPlugin(CustomEase);

export default class globalTransition extends Transition {

  onLeave({ from, trigger, done }) {
    const tsbox = document.querySelector('.tsbox')
    const overlay = document.querySelector('.overlay')

    gsap.set(tsbox, { y: '100%', opacity: 1 })
    gsap.set(overlay, { opacity: 0 })

    const tl = gsap.timeline({ onComplete: done })


    .to(overlay, {
      opacity: 0.6,
      duration: 1.2,
      ease: 'power3.inOut',
    }, 0)
    .to(tsbox, {
      y: '0%',
      duration: 1.4,
      ease: 'power4.inOut',
    }, 0.1)
    .to(from,{
        y: '-5%',
        duration: 1.4,
        ease: 'power4.inOut'
    }, 0.1)
  }

  onEnter({ to, trigger, done }) {
    const tsbox = document.querySelector('.tsbox')

    lenis.scrollTo(0, { immediate: true })

    const overlay = document.querySelector('.overlay')

    gsap.set(to, { opacity: 1, scale: 1, y: '0%' })
    gsap.set(overlay, { opacity: 0 })

    const tl = gsap.timeline({ onComplete: done })

    tl.to(tsbox, {
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
  }
}