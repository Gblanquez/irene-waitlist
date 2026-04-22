import { Renderer } from '@unseenco/taxi';
import { startRAF, stopRAF, setOnScrollUpdate } from '../components/scroll.js'
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

export default class defaultRender extends Renderer {


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
      this.runPageSetup()
      }
  onEnter() {
    startRAF()
    this.runPageSetup()
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
