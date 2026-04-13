import { Core } from '@unseenco/taxi'
import globalTransition from './globalTransition.js'
import globalRender from './globalRender.js'
import collabRender from './collabRender.js'

const taxi = new Core({
  renderers: {
    default: globalRender,
    home: globalRender,
    about: globalRender,
    capability: globalRender,
    work: globalRender,
    collaboration: collabRender,
  },
  transitions: {
    default: globalTransition,
    home: globalTransition,
    about: globalTransition,
    work: globalTransition,
    collaboration: globalTransition,
    capability: globalTransition,

  },
  removeOldContent: true,
})

export default taxi