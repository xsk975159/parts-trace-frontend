export default {
  namespaced: true,
  state: {
    unreadAlerts: 0,
    rules: []
  },
  mutations: {
    SET_UNREAD_ALERTS(state, count) {
      state.unreadAlerts = count
    },
    SET_RULES(state, rules) {
      state.rules = rules
    }
  },
  actions: {
    setUnreadAlerts({ commit }, count) {
      commit('SET_UNREAD_ALERTS', count)
    },
    setRules({ commit }, rules) {
      commit('SET_RULES', rules)
    }
  }
}
