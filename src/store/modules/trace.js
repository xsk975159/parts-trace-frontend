export default {
  namespaced: true,
  state: {
    traceChain: [],
    currentEvent: null
  },
  mutations: {
    SET_TRACE_CHAIN(state, chain) {
      state.traceChain = chain
    },
    SET_CURRENT_EVENT(state, event) {
      state.currentEvent = event
    }
  },
  actions: {
    setTraceChain({ commit }, chain) {
      commit('SET_TRACE_CHAIN', chain)
    },
    setCurrentEvent({ commit }, event) {
      commit('SET_CURRENT_EVENT', event)
    }
  }
}
