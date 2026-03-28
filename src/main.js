import './styles/style.css'
import './components/scroll.js'
import { initScaling } from './components/scaling.js'
import globalLinesReveal from './components/lines.js'
import globalVerticalLinesReveal from './components/vertical-lines.js'
import formAnimation from './components/form.js'
import bodyTextReveal from './components/bodyText.js'
import globalLinkHover from './components/linksHover.js'

initScaling();
globalVerticalLinesReveal();
globalLinesReveal();
formAnimation();
bodyTextReveal();
globalLinkHover();

