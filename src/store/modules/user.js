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
      const token = res.data.accessToken || res.data.token
      if (!token) {
        return Promise.reject(new Error('登录返回缺少 token'))
      }
      commit('SET_TOKEN', token)
      return res
    },
    async getUserInfo({ commit }) {
      const res = await getUserInfo()
      const userInfo = res.data.userInfo || res.data
      const permissions = res.data.permissions || []
      commit('SET_USER_INFO', userInfo)
      commit('SET_PERMISSIONS', permissions)
      return res
    },
    logout({ commit }) {
      commit('CLEAR_USER')
    }
  }
}
