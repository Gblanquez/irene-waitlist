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
import collabLinkPageHover from './components/collaboratorLink.js'

import SketchManager from './sketch/sketch.js'
import {setOnScrollUpdate} from './components/scroll.js'

import taxi from './taxi/transition.js'

initScaling()
globalVerticalLinesReveal()
globalLinesReveal()
formAnimation()
bodyTextReveal()
globalLinkHover()
labelTextReveal()
titleTextReveal()
globalLinkPageHover()
collabLinkPageHover()


