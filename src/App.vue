<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

onMounted(() => {
  // 检查登录状态
  const token = localStorage.getItem('token')
  if (token) {
    store.dispatch('user/getUserInfo')
  }
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
