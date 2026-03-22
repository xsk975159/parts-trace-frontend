<template>
  <div class="login-container">
    <div class="login-background">
      <div class="grid-pattern"></div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <div class="login-card fade-in">
      <div class="login-header">
        <div class="logo-section">
          <el-icon :size="48" color="#4a90e2"><Box /></el-icon>
        </div>
        <h1 class="title">工业零部件溯源系统</h1>
        <p class="subtitle">基于区块链的可信溯源与监管平台</p>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="demo-accounts">
        <p class="demo-title">测试账号</p>
        <div class="demo-list">
          <div class="demo-item" @click="fillAccount('admin', 'admin123')">
            <el-tag type="danger" size="small">管理员</el-tag>
            <span>admin / admin123</span>
          </div>
          <div class="demo-item" @click="fillAccount('manufacturer1', '123456')">
            <el-tag type="success" size="small">生产商</el-tag>
            <span>manufacturer1 / 123456</span>
          </div>
          <div class="demo-item" @click="fillAccount('logistics1', '123456')">
            <el-tag type="warning" size="small">物流商</el-tag>
            <span>logistics1 / 123456</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Lock, Box } from '@element-plus/icons-vue'

const router = useRouter()
const store = useStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const fillAccount = (username, password) => {
  loginForm.username = username
  loginForm.password = password
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await store.dispatch('user/login', loginForm)
        await store.dispatch('user/getUserInfo')
        ElMessage.success('登录成功')
        router.push('/')
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%);
}

.grid-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(37, 99, 235, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.07) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  animation: float 20s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: #4a90e2;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 400px;
  height: 400px;
  background: #38b2ac;
  bottom: 10%;
  right: 10%;
  animation-delay: 5s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: #ed8936;
  top: 50%;
  left: 50%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

.login-card {
  position: relative;
  z-index: 10;
  width: 450px;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(37,99,235,0.10), 0 0 0 1px rgba(37,99,235,0.12);
  border: 1px solid rgba(37,99,235,0.10);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-section {
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 14px;
  color: #a0aec0;
  font-weight: 400;
}

.login-form {
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37,99,235,0.22);
}

.demo-accounts {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.demo-title {
  font-size: 13px;
  color: #a0aec0;
  margin-bottom: 12px;
  text-align: center;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(45, 55, 72, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  color: #475569;
}

.demo-item:hover {
  background: rgba(74, 144, 226, 0.1);
  transform: translateX(4px);
}

:deep(.el-input__wrapper) {
  background: rgba(45, 55, 72, 0.5);
  border: 1px solid rgba(74, 144, 226, 0.2);
  box-shadow: none;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #93c5fd;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

:deep(.el-input__inner) {
  color: #e2e8f0;
}

:deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}
</style>
