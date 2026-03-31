import { Renderer } from '@unseenco/taxi';
import { lenis, startRAF, stopRAF,setOnScrollUpdate } from '../components/scroll.js'


import { initScaling } from '../components/scaling.js'
import SketchManager from '../sketch/sketch.js'

import gsap from 'gsap'

export default class defaultRender extends Renderer {
    initialLoad()
     {

      startRAF()

      const container = document.querySelector('.page-wrapper')

      if (container) {
      SketchManager.init(container)
    
  
  
    setOnScrollUpdate(({ velocity }) => {
      SketchManager.setVelocity(velocity)
    })
      }
      

      }
  onEnter() {
    startRAF()
    initScaling()
    SketchManager.refreshMeshes()
  }

  onEnterCompleted() {



  }

  onLeave() {

    stopRAF()

  }

  onLeaveCompleted()
  {


  }
}
