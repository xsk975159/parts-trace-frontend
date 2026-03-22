export default {
  namespaced: true,
  state: {
    categories: [],
    currentPart: null
  },
  mutations: {
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },
    SET_CURRENT_PART(state, part) {
      state.currentPart = part
    }
  },
  actions: {
    setCategories({ commit }, categories) {
      commit('SET_CATEGORIES', categories)
    },
    setCurrentPart({ commit }, part) {
      commit('SET_CURRENT_PART', part)
    }
  }
}
