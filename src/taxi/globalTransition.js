import { Transition } from "@unseenco/taxi";
import gsap from "gsap";


import { lenis, startRAF, stopRAF } from '../components/scroll.js'



export default class globalTransition extends Transition {


  onLeave({ from, trigger, done }) {

    gsap.to(from,
        {
            opacity: 0,
            duration: 1.1,
            ease: 'expo.out',
            oncomplete: done,
        })
    

  }

  onEnter({ to, trigger, done }) {
    
    gsap.to(to,
        {
            opacity: 1,
            duration: 1.1,
            ease: 'expo.out',
            oncomplete: done,
        })


  }
}