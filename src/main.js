import './styles/style.css'
import './components/scroll.js'

import { initScaling } from './components/scaling.js'
import globalLinesReveal from './components/lines.js'
import globalVerticalLinesReveal from './components/vertical-lines.js'
import formAnimation from './components/form.js'
import bodyTextReveal from './components/bodyText.js'
import titleTextReveal from './components/titleText.js'
import labelTextReveal from './components/labelText.js'
import globalLinkHover from './components/linksHover.js'
import globalLinkPageHover from './components/globalLinks.js'

import SketchManager from './sketch/sketch.js'
import {setOnScrollUpdate} from './components/scroll.js'

initScaling()
globalVerticalLinesReveal()
globalLinesReveal()
formAnimation()
bodyTextReveal()
globalLinkHover()
labelTextReveal()
titleTextReveal()
globalLinkPageHover()


const container = document.querySelector('.page-wrapper')

if (container) {
  SketchManager.init(container)
  


  setOnScrollUpdate(({ velocity }) => {
    SketchManager.setVelocity(velocity)
  })
}