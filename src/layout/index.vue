<template>
  <div class="layout-container">
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
        <div class="logo-container">
          <el-icon v-if="!isCollapse" :size="32" color="#4a90e2"><Box /></el-icon>
          <span v-if="!isCollapse" class="logo-text">零部件溯源</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :unique-opened="true"
          router
          class="sidebar-menu"
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-sub-menu v-if="route.children && route.children.length > 0" :index="'/' + route.path">
              <template #title>
                <el-icon><component :is="route.meta.icon" /></el-icon>
                <span>{{ route.meta.title }}</span>
              </template>
              <el-menu-item
                v-for="child in route.children"
                :key="child.path"
                :index="'/' + route.path + '/' + child.path"
              >
                <el-icon><component :is="child.meta.icon" /></el-icon>
                <span>{{ child.meta.title }}</span>
              </el-menu-item>
            </el-sub-menu>
            
            <el-menu-item v-else :index="'/' + route.path">
              <el-icon><component :is="route.meta.icon" /></el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-icon" @click="toggleCollapse">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-badge :value="unreadAlerts" :hidden="unreadAlerts === 0" class="alert-badge">
              <el-icon :size="20" class="header-icon"><BellFilled /></el-icon>
            </el-badge>
            
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="32" :src="userInfo?.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="username">{{ userInfo?.realName || '用户' }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, Fold, Expand, BellFilled, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const isCollapse = ref(false)
const activeMenu = ref(route.path)

const userInfo = computed(() => store.state.user.userInfo)
const unreadAlerts = computed(() => store.state.anomaly.unreadAlerts)

const menuRoutes = computed(() => {
  const routes = router.options.routes.find(r => r.path === '/')
  return routes?.children?.filter(r => r.meta?.title) || []
})

const currentRoute = computed(() => {
  return route.meta?.title || ''
})

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      store.dispatch('user/logout')
      router.push('/login')
      ElMessage.success('已退出登录')
    } catch (error) {
      // 取消操作
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  } else if (command === 'settings') {
    ElMessage.info('系统设置功能开发中')
  }
}
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.el-container {
  height: 100%;
}

.sidebar {
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  transition: width 0.3s ease;
  overflow-x: hidden;
  box-shadow: 2px 0 8px rgba(0,0,0,0.06);
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid #e2e8f0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.sidebar-menu {
  border: none;
  background: transparent;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #475569;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: #eff6ff;
  color: #2563eb;
}

:deep(.el-menu-item.is-active) {
  background: #dbeafe;
  color: #2563eb;
  border-right: 3px solid #2563eb;
}

.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #475569;
  transition: all 0.3s ease;
}

.collapse-icon:hover {
  color: #2563eb;
}

:deep(.el-breadcrumb__inner) {
  color: #475569;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.alert-badge {
  cursor: pointer;
}

.header-icon {
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-icon:hover {
  color: #2563eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background: #eff6ff;
}

.username {
  font-size: 14px;
  color: #1e293b;
}

.main-content {
  background: var(--bg-primary);
  padding: 24px;
  overflow-y: auto;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
