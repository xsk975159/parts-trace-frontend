<template>
  <div class="dashboard-container">
    <div class="welcome-bar">
      <div>
        <div class="welcome-title">{{ greeting }}，{{ userInfo?.realName || '管理员' }}</div>
        <div class="welcome-sub">今日 {{ todayDate }}，系统运行正常</div>
      </div>
      <div class="welcome-actions">
        <el-button size="small" @click="$router.push('/query')">追溯查询</el-button>
        <el-button size="small" type="primary" @click="$router.push('/parts/list')">零部件管理</el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, i) in stats" :key="stat.title"
           :style="{ animationDelay: i * 0.08 + 's' }">
        <div class="stat-icon" :style="{ background: stat.color }">
          <el-icon :size="26"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}% 较上月
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="activity-card">
        <div class="card-header">
          <h3><el-icon><Timer /></el-icon> 最近溯源事件</h3>
          <el-button size="small" link type="primary" @click="$router.push('/trace/event')">查看全部</el-button>
        </div>
        <div class="activity-list">
          <div class="activity-item" v-for="event in recentEvents" :key="event.id">
            <div class="activity-dot" :class="event.eventType"></div>
            <div class="activity-content">
              <div class="activity-header">
                <span class="activity-title">{{ event.eventName }}</span>
                <el-tag :type="eventTypeTag(event.eventType)" size="small">{{ eventTypeLabel(event.eventType) }}</el-tag>
              </div>
              <div class="activity-desc">零部件 {{ event.partsCode }} · {{ event.operatorName }}</div>
              <div class="activity-time">{{ event.eventTime }}</div>
            </div>
          </div>
          <el-empty v-if="recentEvents.length === 0" description="暂无事件" :image-size="60" />
        </div>
      </div>

      <div class="alert-card">
        <div class="card-header">
          <h3>
            <el-icon><Warning /></el-icon> 异常预警
            <el-badge :value="unhandledCount" v-if="unhandledCount > 0" style="margin-left:8px" />
          </h3>
          <el-button size="small" @click="$router.push('/anomaly/alert')">处理预警</el-button>
        </div>
        <el-empty v-if="alertItems.length === 0" description="暂无预警" :image-size="60" />
        <div class="alert-list" v-else>
          <div class="alert-item" v-for="alert in alertItems" :key="alert.id" :class="alert.alertLevel">
            <div class="alert-level-dot" :class="alert.alertLevel"></div>
            <div class="alert-info">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-desc">{{ alert.description }}</div>
              <div class="alert-meta">
                <el-tag :type="alert.status === 0 ? 'danger' : 'success'" size="small">
                  {{ alert.status === 0 ? '未处理' : '已处理' }}
                </el-tag>
                <span class="alert-time">{{ alert.alertTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-grid">
      <div class="parts-card">
        <div class="card-header">
          <h3><el-icon><Box /></el-icon> 零部件状态概览</h3>
          <el-button size="small" @click="$router.push('/parts/list')">查看列表</el-button>
        </div>
        <div class="parts-summary">
          <div class="summary-item" v-for="item in partsSummary" :key="item.label" @click="$router.push('/parts/list')">
            <div class="summary-header">
              <span class="summary-label">{{ item.label }}</span>
              <span class="summary-value" :style="{ color: item.color }">{{ item.value }}</span>
            </div>
            <div class="summary-bar">
              <div class="summary-bar-fill" :style="{ width: item.pct + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-card">
        <div class="card-header">
          <h3><el-icon><Grid /></el-icon> 快速入口</h3>
        </div>
        <div class="quick-grid">
          <div class="quick-item" v-for="q in quickLinks" :key="q.path" @click="$router.push(q.path)">
            <div class="quick-icon" :style="{ background: q.color }">
              <el-icon :size="20"><component :is="q.icon" /></el-icon>
            </div>
            <div class="quick-label">{{ q.label }}</div>
          </div>
        </div>
      </div>

      <div class="chain-card">
        <div class="card-header">
          <h3><el-icon><Link /></el-icon> 区块链状态</h3>
        </div>
        <div class="chain-stats">
          <div class="chain-row"><span class="chain-label">链上事件总数</span><span class="chain-val">{{ statsData.totalEvents }}</span></div>
          <div class="chain-row"><span class="chain-label">数字凭证总数</span><span class="chain-val">{{ statsData.totalCertificates }}</span></div>
          <div class="chain-row"><span class="chain-label">质检通过率</span><span class="chain-val ok">{{ statsData.qualityPassRate }}%</span></div>
          <div class="chain-row"><span class="chain-label">今日新增事件</span><span class="chain-val">{{ statsData.todayEvents }}</span></div>
          <div class="chain-row"><span class="chain-label">本月事件总数</span><span class="chain-val">{{ statsData.monthEvents }}</span></div>
          <div class="chain-row"><span class="chain-label">节点连接状态</span><span class="chain-val ok">正常</span></div>
        </div>
        <div class="chain-indicator">
          <span class="indicator-dot"></span>
          <span>ChainMaker 节点运行中</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { Timer, Warning, Box, Grid, Link } from '@element-plus/icons-vue'
import { getDashboardStats } from '@/api/dashboard'
import { getEventList } from '@/api/trace'
import { getAlertList } from '@/api/anomaly'

const store = useStore()
const userInfo = computed(() => store.state.user.userInfo)

const statsData = ref({
  totalParts: 0, totalEvents: 0, totalCertificates: 0, totalAlerts: 0,
  unhandledAlerts: 0, todayEvents: 0, monthEvents: 0, qualityPassRate: 0
})
const recentEvents = ref([])
const alertItems = ref([])
const unhandledCount = computed(() => alertItems.value.filter(a => a.status === 0).length)

const todayDate = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
const hour = new Date().getHours()
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

const stats = computed(() => [
  { title: '零部件总数', value: statsData.value.totalParts.toLocaleString(), icon: 'Box', color: 'linear-gradient(135deg,#667eea,#764ba2)', trend: 12.5 },
  { title: '溯源事件', value: statsData.value.totalEvents.toLocaleString(), icon: 'Document', color: 'linear-gradient(135deg,#f093fb,#f5576c)', trend: 8.3 },
  { title: '数字凭证', value: statsData.value.totalCertificates.toLocaleString(), icon: 'Tickets', color: 'linear-gradient(135deg,#4facfe,#00f2fe)', trend: 15.7 },
  { title: '待处理预警', value: statsData.value.unhandledAlerts.toString(), icon: 'Warning', color: 'linear-gradient(135deg,#fa709a,#fee140)', trend: -5.2 }
])

const partsSummary = computed(() => [
  { label: '零部件总量', value: statsData.value.totalParts, color: '#4a90e2', pct: 100 },
  { label: '在途中', value: Math.floor(statsData.value.totalParts * 0.13), color: '#ed8936', pct: 13 },
  { label: '已交付', value: Math.floor(statsData.value.totalParts * 0.85), color: '#48bb78', pct: 85 },
  { label: '质检通过率', value: statsData.value.qualityPassRate + '%', color: '#38b2ac', pct: Number(statsData.value.qualityPassRate) }
])

const quickLinks = [
  { path: '/query', label: '追溯查询', icon: 'Search', color: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { path: '/trace/event', label: '溯源事件', icon: 'Document', color: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { path: '/trace/certificate', label: '凭证管理', icon: 'Tickets', color: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { path: '/anomaly/rule', label: '规则配置', icon: 'Setting', color: 'linear-gradient(135deg,#fa709a,#fee140)' },
  { path: '/parts/list', label: '零部件', icon: 'Box', color: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { path: '/user/list', label: '用户管理', icon: 'User', color: 'linear-gradient(135deg,#4481eb,#04befe)' }
]

const eventTypeLabel = (t) => ({ production: '生产', quality: '质检', logistics: '物流', delivery: '交付' }[t] || t)
const eventTypeTag = (t) => ({ production: '', quality: 'success', logistics: 'warning', delivery: 'info' }[t] || '')

const loadDashboard = async () => {
  try {
    const statsRes = await getDashboardStats()
    if (statsRes?.data) {
      statsData.value = { ...statsData.value, ...statsRes.data }
    }
  } catch {
    /* 拦截器已提示 */
  }
  try {
    const eventsRes = await getEventList({ page: 1, pageSize: 10 })
    const list = eventsRes?.data?.list || []
    recentEvents.value = Array.isArray(list) ? list.slice(0, 5) : []
  } catch {
    recentEvents.value = []
  }
  try {
    const alertsRes = await getAlertList({})
    const list = alertsRes?.data?.list || []
    alertItems.value = list
    store.dispatch('anomaly/setUnreadAlerts', list.filter((a) => a.status === 0).length)
  } catch {
    alertItems.value = []
  }
}

onMounted(loadDashboard)
</script>

<style scoped>
.dashboard-container { display: flex; flex-direction: column; gap: 24px; }

.welcome-bar {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%, #2563eb 100%);
  border-radius: 16px; padding: 24px 28px;
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid rgba(74,144,226,.25);
  animation: fadeIn 0.4s ease-out;
}
.welcome-title { font-size: 22px; font-weight: 700; color: white; margin-bottom: 6px; }
.welcome-sub { font-size: 14px; color: rgba(255,255,255,.65); }
.welcome-actions { display: flex; gap: 10px; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
.stat-card { background: #ffffff; border-radius: 16px; padding: 22px; display: flex; align-items: center; gap: 18px; border: 1px solid #e2e8f0; transition: all 0.3s; animation: fadeIn 0.5s ease-out both; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.10); }
.stat-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #1e293b; }
.stat-title { font-size: 13px; color: #475569; margin: 3px 0; }
.stat-trend { font-size: 12px; font-weight: 600; }
.stat-trend.up { color: #48bb78; }
.stat-trend.down { color: #f56565; }

.content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; }

.activity-card, .alert-card, .parts-card, .quick-card, .chain-card { background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #e2e8f0; animation: fadeIn 0.6s ease-out; }

.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; }
.card-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px; }

.activity-list { display: flex; flex-direction: column; gap: 14px; }
.activity-item { display: flex; gap: 12px; align-items: flex-start; }
.activity-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.activity-dot.production { background: #764ba2; }
.activity-dot.quality { background: #48bb78; }
.activity-dot.logistics { background: #4299e1; }
.activity-dot.delivery { background: #38b2ac; }
.activity-content { flex: 1; }
.activity-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.activity-title { font-size: 14px; font-weight: 600; color: #1e293b; }
.activity-desc { font-size: 13px; color: #475569; margin-bottom: 2px; }
.activity-time { font-size: 12px; color: #94a3b8; }

.alert-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 10px; border-left: 3px solid #ed8936; background: rgba(237,137,54,.06); }
.alert-item.error { border-color: #f56565; background: rgba(245,101,101,.06); }
.alert-level-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
.alert-level-dot.warning { background: #ed8936; }
.alert-level-dot.error { background: #f56565; }
.alert-info { flex: 1; }
.alert-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.alert-desc { font-size: 13px; color: #475569; margin-bottom: 6px; }
.alert-meta { display: flex; align-items: center; gap: 10px; }
.alert-time { font-size: 12px; color: #94a3b8; }

.bottom-grid { display: grid; grid-template-columns: 1fr 1fr 280px; gap: 20px; }

.parts-summary { display: flex; flex-direction: column; gap: 16px; }
.summary-item { cursor: pointer; }
.summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.summary-label { font-size: 13px; color: #475569; }
.summary-value { font-size: 16px; font-weight: 700; }
.summary-bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.summary-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.quick-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 8px; border-radius: 12px; cursor: pointer; background: #f1f5f9; transition: all .3s; }
.quick-item:hover { background: rgba(74,144,226,.12); transform: translateY(-3px); }
.quick-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.quick-label { font-size: 12px; color: #475569; text-align: center; }

.chain-stats { display: flex; flex-direction: column; gap: 2px; }
.chain-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid rgba(74,144,226,.08); font-size: 13px; }
.chain-row:last-child { border-bottom: none; }
.chain-label { color: #475569; }
.chain-val { font-weight: 600; color: #1e293b; }
.chain-val.ok { color: #48bb78; }

.chain-indicator { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #48bb78; }
.indicator-dot { width: 8px; height: 8px; border-radius: 50%; background: #48bb78; animation: pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
</style>
