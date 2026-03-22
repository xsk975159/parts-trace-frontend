<template>
  <div class="page-container">
    <div class="page-header">
      <h2>异常预警</h2>
      <div class="header-stats">
        <span class="stat-badge total">总计 {{ alertList.length }} 条</span>
        <span class="stat-badge unhandled">未处理 {{ unhandled }} 条</span>
      </div>
    </div>

    <div class="search-bar">
      <el-select v-model="searchForm.alertLevel" placeholder="预警级别" clearable style="width:140px" @change="fetchAlerts">
        <el-option label="警告" value="warning" />
        <el-option label="严重" value="error" />
      </el-select>
      <el-select v-model="searchForm.status" placeholder="处理状态" clearable style="width:140px" @change="fetchAlerts">
        <el-option label="未处理" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
      <el-button type="primary" @click="fetchAlerts">刷新</el-button>
    </div>

    <div class="alert-list">
      <div v-for="alert in filteredAlerts" :key="alert.id"
           class="alert-card" :class="[alert.alertLevel, { handled: alert.status === 1 }]">
        <div class="alert-card-header">
          <div class="alert-left">
            <div class="alert-level-icon" :class="alert.alertLevel">
              <el-icon :size="20"><WarningFilled /></el-icon>
            </div>
            <div>
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-meta">
                <el-tag :type="alert.alertLevel === 'error' ? 'danger' : 'warning'" size="small">
                  {{ alert.alertLevel === 'error' ? '严重' : '警告' }}
                </el-tag>
                <span>零部件：{{ alert.partsCode }}</span>
                <span>触发规则：{{ alert.ruleName }}</span>
              </div>
            </div>
          </div>
          <div class="alert-right">
            <el-tag :type="alert.status === 1 ? 'success' : 'danger'" size="small">
              {{ alert.status === 1 ? '已处理' : '未处理' }}
            </el-tag>
            <span class="alert-time">{{ alert.alertTime }}</span>
          </div>
        </div>

        <div class="alert-desc">{{ alert.description }}</div>

        <div v-if="alert.status === 1" class="alert-handle-info">
          <el-icon><SuccessFilled /></el-icon>
          <span>处理人：{{ alert.handler }} | {{ alert.handleTime }}</span>
          <span class="handle-result">{{ alert.handleResult }}</span>
        </div>

        <div v-if="alert.status === 0" class="alert-actions">
          <el-button type="primary" size="small" @click="openHandleDialog(alert)">处理预警</el-button>
          <el-button size="small" @click="ignoreAlert(alert)">忽略</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredAlerts.length === 0" description="暂无预警信息" />

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleDialogVisible" title="处理预警" width="480px">
      <el-form ref="handleFormRef" :model="handleForm" label-width="90px">
        <el-form-item label="处理说明">
          <el-input v-model="handleForm.result" type="textarea" :rows="4" placeholder="请输入处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, SuccessFilled } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'
import { useStore } from 'vuex'

const store = useStore()
const alertList = ref([])
const handleDialogVisible = ref(false)
const handleFormRef = ref(null)
const currentAlert = ref(null)

const searchForm = reactive({ alertLevel: '', status: '' })
const handleForm = reactive({ result: '' })

const unhandled = computed(() => alertList.value.filter(a => a.status === 0).length)

const filteredAlerts = computed(() => {
  let list = alertList.value
  if (searchForm.alertLevel) list = list.filter(a => a.alertLevel === searchForm.alertLevel)
  if (searchForm.status !== '') list = list.filter(a => a.status === searchForm.status)
  return list
})

const fetchAlerts = () => {
  setTimeout(() => {
    const res = mockData.getMockData('/api/anomaly/alert/list', 'get')
    alertList.value = res.data.list
    store.dispatch('anomaly/setUnreadAlerts', unhandled.value)
  }, 300)
}

const openHandleDialog = (alert) => {
  currentAlert.value = alert
  handleForm.result = ''
  handleDialogVisible.value = true
}

const submitHandle = () => {
  if (!handleForm.result.trim()) {
    ElMessage.warning('请输入处理说明')
    return
  }
  const idx = mockData.alerts.findIndex(a => a.id === currentAlert.value.id)
  if (idx !== -1) {
    Object.assign(mockData.alerts[idx], {
      status: 1,
      handler: '系统管理员',
      handleTime: new Date().toLocaleString(),
      handleResult: handleForm.result
    })
  }
  ElMessage.success('预警已处理')
  handleDialogVisible.value = false
  fetchAlerts()
}

const ignoreAlert = (alert) => {
  const idx = mockData.alerts.findIndex(a => a.id === alert.id)
  if (idx !== -1) {
    mockData.alerts[idx].status = 1
    mockData.alerts[idx].handler = '系统管理员'
    mockData.alerts[idx].handleTime = new Date().toLocaleString()
    mockData.alerts[idx].handleResult = '已忽略'
  }
  ElMessage.info('已忽略该预警')
  fetchAlerts()
}

onMounted(fetchAlerts)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.header-stats { display: flex; gap: 10px; }
.stat-badge {
  padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
}
.stat-badge.total { background: #dbeafe; color: #3b82f6; }
.stat-badge.unhandled { background: rgba(245,101,101,.15); color: #f56565; }
.search-bar { display: flex; gap: 12px; }

.alert-list { display: flex; flex-direction: column; gap: 16px; }

.alert-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 24px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #ed8936;
  transition: all .3s;
}
.alert-card.error { border-left-color: #f56565; }
.alert-card.handled { opacity: 0.65; }
.alert-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.2); }

.alert-card-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; margin-bottom: 12px;
}
.alert-left { display: flex; gap: 14px; align-items: flex-start; }
.alert-level-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.alert-level-icon.warning { background: rgba(237,137,54,.15); color: #ed8936; }
.alert-level-icon.error { background: rgba(245,101,101,.15); color: #f56565; }
.alert-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
.alert-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.alert-meta span { font-size: 13px; color: #475569; }
.alert-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.alert-time { font-size: 12px; color: #94a3b8; }
.alert-desc { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 14px; padding-left: 54px; }
.alert-handle-info {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: rgba(72,187,120,.08);
  border-radius: 8px; font-size: 13px; color: #48bb78;
}
.handle-result { color: #475569; margin-left: 8px; }
.alert-actions { display: flex; gap: 10px; padding-left: 54px; }
</style>
