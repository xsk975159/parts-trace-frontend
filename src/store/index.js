import { createStore } from 'vuex'
import user from './modules/user'
import parts from './modules/parts'
import trace from './modules/trace'
import anomaly from './modules/anomaly'

export default createStore({
  modules: {
    user,
    parts,
    trace,
    anomaly
  }
})
