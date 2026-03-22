import { login, getUserInfo } from '@/api/user'

export default {
  namespaced: true,
  state: {
    token: localStorage.getItem('token') || '',
    userInfo: null,
    permissions: []
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
    },
    SET_PERMISSIONS(state, permissions) {
      state.permissions = permissions
    },
    CLEAR_USER(state) {
      state.token = ''
      state.userInfo = null
      state.permissions = []
      localStorage.removeItem('token')
    }
  },
  actions: {
    async login({ commit }, loginForm) {
      const res = await login(loginForm)
      if (res.code !== 200) {
        return Promise.reject(new Error(res.message || '登录失败'))
      }
      commit('SET_TOKEN', res.data.token)
      return res
    },
    async getUserInfo({ commit }) {
      const res = await getUserInfo()
      commit('SET_USER_INFO', res.data.userInfo)
      commit('SET_PERMISSIONS', res.data.permissions)
      return res
    },
    logout({ commit }) {
      commit('CLEAR_USER')
    }
  }
}
