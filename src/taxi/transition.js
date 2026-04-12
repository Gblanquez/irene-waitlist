import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'

const taxi = new Core({
  renderers: {
    home: globalRender,
    about: globalRender,
    capability: globalRender,
    work: globalRender,
    collaboration: globalRender,
  },
  transitions: {
    home: globalTransition,
    about: globalTransition,
    work: globalTransition,
    collaboration: globalTransition,
    capability: globalTransition,
    default: globalTransition,
  },
  removeOldContent: true,
})

export default taxi