<template>
  <div class="page-container">
    <div class="page-header">
      <h2>溯源事件记录</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增事件</el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索零部件编码"
        clearable
        style="width: 220px"
        @clear="fetchEvents"
        @keyup.enter="fetchEvents"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="searchForm.eventType" placeholder="事件类型" clearable style="width: 140px" @change="fetchEvents">
        <el-option label="生产" value="production" />
        <el-option label="质检" value="quality" />
        <el-option label="物流" value="logistics" />
        <el-option label="交付" value="delivery" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchEvents">搜索</el-button>
    </div>

    <el-table :data="eventList" v-loading="loading" class="data-table">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="partsCode" label="零部件编码" width="140" />
      <el-table-column prop="eventType" label="事件类型" width="110">
        <template #default="{ row }">
          <el-tag :type="eventTypeTag(row.eventType)" size="small">{{ eventTypeLabel(row.eventType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="eventName" label="事件名称" width="140" />
      <el-table-column prop="operatorName" label="操作人" width="120" />
      <el-table-column prop="location" label="地点" width="140" />
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="eventTime" label="事件时间" width="170" />
      <el-table-column label="区块链" width="120">
        <template #default="{ row }">
          <el-tooltip :content="row.txHash || '-'" placement="top">
            <el-tag :type="row.txHash ? 'success' : 'info'" size="small">
              <el-icon><SuccessFilled /></el-icon>
              {{ row.txHash ? '已上链' : '未上链' }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        layout="total,prev,pager,next"
        background
        @current-change="fetchEvents"
      />
    </div>

    <el-dialog v-model="dialogVisible" title="新增溯源事件" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="零部件编码" prop="partsCode">
          <el-select v-model="form.partsCode" filterable style="width: 100%" placeholder="选择零部件">
            <el-option
              v-for="p in allParts"
              :key="p.id"
              :label="`${p.partsCode} - ${p.partsName}`"
              :value="p.partsCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型" prop="eventType">
          <el-select v-model="form.eventType" style="width: 100%">
            <el-option label="生产" value="production" />
            <el-option label="质检" value="quality" />
            <el-option label="物流" value="logistics" />
            <el-option label="交付" value="delivery" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件名称" prop="eventName">
          <el-input v-model="form.eventName" placeholder="如：生产完成" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="form.operatorName" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="如：深圳工厂" />
        </el-form-item>
        <el-form-item label="事件时间" prop="eventTime">
          <el-date-picker v-model="form.eventTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">提交上链</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="事件详情" size="480px">
      <div v-if="currentEvent" class="event-detail">
        <div class="event-type-badge" :class="currentEvent.eventType">{{ eventTypeLabel(currentEvent.eventType) }}</div>
        <h3 class="event-name">{{ currentEvent.eventName }}</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="零部件编码">{{ currentEvent.partsCode }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentEvent.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="地点">{{ currentEvent.location }}</el-descriptions-item>
          <el-descriptions-item label="事件时间">{{ currentEvent.eventTime }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ currentEvent.description }}</el-descriptions-item>
        </el-descriptions>
        <div class="chain-info">
          <div class="chain-title"><el-icon><Link /></el-icon> 区块链信息</div>
          <div class="chain-item"><span>TX Hash:</span><code>{{ currentEvent.txHash || '-' }}</code></div>
          <div class="chain-item"><span>Block Hash:</span><code>{{ currentEvent.blockHash || '-' }}</code></div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, SuccessFilled, Link } from '@element-plus/icons-vue'
import { getPartsList } from '@/api/parts'
import { createEvent, getEventList } from '@/api/trace'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const formRef = ref(null)
const eventList = ref([])
const allParts = ref([])
const currentEvent = ref(null)

const searchForm = reactive({ keyword: '', eventType: '' })
const pagination = reactive({ page: 1, size: 10, total: 0 })

const form = reactive({
  partsCode: '',
  eventType: '',
  eventName: '',
  operatorName: '',
  location: '',
  eventTime: '',
  description: ''
})

const rules = {
  partsCode: [{ required: true, message: '请选择零部件', trigger: 'change' }],
  eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  eventName: [{ required: true, message: '请输入事件名称', trigger: 'blur' }],
  eventTime: [{ required: true, message: '请选择事件时间', trigger: 'change' }]
}

const eventTypeLabel = (t) => ({ production: '生产', quality: '质检', logistics: '物流', delivery: '交付' }[t] || t)
const eventTypeTag = (t) => ({ production: '', quality: 'success', logistics: 'warning', delivery: 'info' }[t] || '')

const normalizeEvent = (e) => {
  const fallbackPartsCode = allParts.value.find((p) => p.id === e.partsId)?.partsCode || ''
  return {
    id: e.id,
    partsId: e.partsId,
    partsCode: e.partsCode || e.parts_code || fallbackPartsCode,
    eventType: e.eventType || e.event_type || '',
    eventName: e.eventName || e.event_name || '',
    operatorName: e.operatorName || e.operator_name || '',
    location: e.location || e.eventLocation || e.event_location || '',
    description: e.description || e.remark || '',
    eventTime: e.eventTime || e.event_time || '',
    txHash: e.txHash || e.blockchainTxId || e.blockchain_tx_id || '',
    blockHash: e.blockHash || ''
  }
}

const fetchEvents = async () => {
  loading.value = true
  try {
    const keyword = searchForm.keyword?.trim() || ''
    const partsCode = keyword && !keyword.includes(' ') ? keyword : undefined

    const res = await getEventList({
      page: pagination.page,
      pageSize: pagination.size,
      partsCode,
      eventType: searchForm.eventType || undefined
    })

    const data = res.data || {}
    let list = (data.list || []).map(normalizeEvent)

    if (keyword) {
      const lower = keyword.toLowerCase()
      list = list.filter((item) =>
        (item.partsCode || '').toLowerCase().includes(lower) ||
        (item.eventName || '').toLowerCase().includes(lower) ||
        (item.operatorName || '').toLowerCase().includes(lower)
      )
    }

    eventList.value = list
    pagination.total = list.length
  } finally {
    loading.value = false
  }
}

const fetchParts = async () => {
  const res = await getPartsList({ page: 1, pageSize: 1000 })
  const pageData = res.data || {}
  allParts.value = pageData.records || pageData.list || []
}

const viewDetail = (row) => {
  currentEvent.value = row
  drawerVisible.value = true
}

const openDialog = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(form, {
    partsCode: '',
    eventType: '',
    eventName: '',
    operatorName: '',
    location: '',
    eventTime: '',
    description: ''
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const targetPart = allParts.value.find((p) => p.partsCode === form.partsCode)
      if (!targetPart) {
        ElMessage.error('未找到对应零部件')
        return
      }

      await createEvent({
        partsId: targetPart.id,
        eventType: form.eventType,
        eventName: form.eventName,
        operatorName: form.operatorName,
        eventLocation: form.location,
        eventTime: form.eventTime,
        remark: form.description,
        status: 1
      })

      ElMessage.success('事件已提交上链')
      dialogVisible.value = false
      await fetchEvents()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  await fetchParts()
  await fetchEvents()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.search-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }

.event-detail { padding: 8px 4px; }
.event-type-badge {
  display: inline-block;
  padding: 5px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 14px;
  border: 1px solid currentColor;
}
.event-type-badge.production { background: rgba(102,126,234,.12); color: #a5b4fc; border-color: rgba(102,126,234,.3); }
.event-type-badge.quality { background: rgba(72,187,120,.12); color: #6ee7b7; border-color: rgba(72,187,120,.3); }
.event-type-badge.logistics { background: rgba(237,137,54,.12); color: #fcd34d; border-color: rgba(237,137,54,.3); }
.event-type-badge.delivery { background: rgba(56,178,172,.12); color: #5eead4; border-color: rgba(56,178,172,.3); }

.event-name { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0 0 20px; }

:deep(.el-descriptions__label) {
  background: rgba(255,255,255,0.04) !important;
  color: #94a3b8 !important;
  font-size: 13px;
}
:deep(.el-descriptions__content) {
  background: rgba(255,255,255,0.02) !important;
  color: #1e293b !important;
  font-size: 13px;
}
:deep(.el-descriptions__cell) {
  border-color: rgba(255,255,255,0.08) !important;
}

.chain-info {
  margin-top: 20px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.08);
}
.chain-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #93c5fd;
  margin-bottom: 12px;
  font-size: 14px;
}
.chain-item {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  align-items: flex-start;
}
.chain-item span { color: #94a3b8; flex-shrink: 0; min-width: 80px; }
.chain-item code {
  color: #cbd5e1;
  word-break: break-all;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
}
</style>
