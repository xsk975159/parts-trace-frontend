<template>
  <div class="page-container">
    <div class="page-header">
      <h2>追溯查询</h2>
      <p class="page-desc">输入零部件编码，查询全生命周期溯源链条与区块链凭证</p>
    </div>

    <div class="query-bar">
      <el-input
        v-model="queryCode"
        placeholder="请输入零部件编码，如：P20240001"
        size="large"
        clearable
        style="max-width:500px;flex:1"
        @keyup.enter="doQuery"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" size="large" :loading="loading" @click="doQuery">开始追溯</el-button>
      <div class="quick-links">
        <span class="quick-label">快速查询：</span>
        <el-tag v-for="code in quickCodes" :key="code" class="quick-tag" @click="quickQuery(code)">{{ code }}</el-tag>
      </div>
    </div>

    <div v-if="loading" class="loading-area">
      <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
      <p>正在从区块链检索数据...</p>
    </div>

    <div v-else-if="result" class="result-container fade-in">
      <div class="parts-info-card">
        <div class="parts-info-header">
          <div>
            <div class="parts-code">{{ result.parts.partsCode }}</div>
            <div class="parts-name">{{ result.parts.partsName }}</div>
          </div>
          <div class="parts-badges">
            <el-tag type="success" size="large">已上链存证</el-tag>
            <el-tag type="primary">批次：{{ result.parts.batchNumber }}</el-tag>
          </div>
        </div>
        <div class="parts-meta">
          <div class="meta-item" v-for="m in partsMeta" :key="m.label">
            <span class="meta-label">{{ m.label }}</span>
            <span class="meta-value">{{ m.value }}</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="timeline-card">
          <div class="section-title">
            <el-icon><Connection /></el-icon> 溯源链条
            <span class="section-count">{{ result.events.length }} 个事件</span>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="event in result.events"
              :key="event.id"
              :type="eventTimelineType(event.eventType)"
              :timestamp="event.eventTime"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-header">
                  <el-tag :type="eventTypeTag(event.eventType)" size="small">{{ eventTypeLabel(event.eventType) }}</el-tag>
                  <span class="timeline-event-name">{{ event.eventName }}</span>
                </div>
                <div class="timeline-body">
                  <div><span class="tl-label">操作人：</span>{{ event.operatorName }}</div>
                  <div><span class="tl-label">地点：</span>{{ event.location }}</div>
                  <div><span class="tl-label">描述：</span>{{ event.description }}</div>
                </div>
                <div class="timeline-chain">
                  <el-icon><Link /></el-icon>
                  <code>{{ event.txHash }}</code>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="certs-card">
          <div class="section-title">
            <el-icon><Tickets /></el-icon> 数字凭证
            <span class="section-count">{{ result.certificates.length }} 份</span>
          </div>
          <div class="mini-cert" v-for="cert in result.certificates" :key="cert.id">
            <div class="mini-cert-header" :class="cert.certificateType">
              <span>{{ certTypeLabel(cert.certificateType) }}</span>
              <el-icon v-if="cert.verified"><SuccessFilled /></el-icon>
            </div>
            <div class="mini-cert-body">
              <div class="mini-cert-name">{{ cert.certificateName }}</div>
              <div class="mini-cert-info">签发方：{{ cert.issuer }}</div>
              <div class="mini-cert-info">{{ cert.issueTime }}</div>
              <code class="mini-cert-hash">{{ cert.certificateHash }}</code>
            </div>
          </div>

          <div class="chain-summary">
            <div class="chain-summary-title"><el-icon><Link /></el-icon> 区块链摘要</div>
            <div class="chain-row"><span>上链事件数</span><strong>{{ result.events.length }}</strong></div>
            <div class="chain-row"><span>数字凭证数</span><strong>{{ result.certificates.length }}</strong></div>
            <div class="chain-row"><span>数据完整性</span><strong class="ok">验证通过</strong></div>
            <div class="chain-row">
              <span>最新区块</span>
              <code>{{ result.events[result.events.length - 1]?.blockHash }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="searched" class="no-result">
      <el-empty description="未找到该零部件的溯源信息" :image-size="120" />
    </div>

    <div v-else class="empty-hint">
      <el-icon :size="80" color="#cbd5e1"><Search /></el-icon>
      <p>请输入零部件编码进行追溯查询</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Connection, Tickets, Link, SuccessFilled, Loading } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'

const queryCode = ref('')
const loading = ref(false)
const searched = ref(false)
const result = ref(null)
const quickCodes = ['P20240001', 'P20240002', 'P20240003']

const partsMeta = computed(() => {
  if (!result.value) return []
  const p = result.value.parts
  return [
    { label: '生产厂商', value: p.manufacturer },
    { label: '规格型号', value: p.specification },
    { label: '生产日期', value: p.productionDate },
    { label: '质量标准', value: p.qualityStandard }
  ]
})

const eventTypeLabel = (t) => ({ production: '生产', quality: '质检', logistics: '物流', delivery: '交付' }[t] || t)
const eventTypeTag = (t) => ({ production: '', quality: 'success', logistics: 'warning', delivery: 'info' }[t] || '')
const eventTimelineType = (t) => ({ production: 'primary', quality: 'success', logistics: 'warning', delivery: 'info' }[t] || 'primary')
const certTypeLabel = (t) => ({ production: '生产证明', quality: '质检报告', logistics: '流转证明' }[t] || t)

const doQuery = () => {
  const code = queryCode.value.trim()
  if (!code) { ElMessage.warning('请输入零部件编码'); return }
  loading.value = true
  searched.value = true
  result.value = null
  setTimeout(() => {
    const res = mockData.getMockData(`/api/trace/query/${code}`, 'get')
    result.value = (res.code === 200 && res.data.parts) ? res.data : null
    loading.value = false
  }, 900)
}

const quickQuery = (code) => { queryCode.value = code; doQuery() }
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.page-desc { font-size: 14px; color: #475569; margin: 0; }
.query-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.quick-links { display: flex; align-items: center; gap: 8px; }
.quick-label { font-size: 13px; color: #475569; }
.quick-tag { cursor: pointer; transition: all .2s; }
.quick-tag:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(74,144,226,.3); }

.loading-area { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px; color: #475569; }
.loading-icon { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.parts-info-card {
  background: #2563eb;
  border-radius: 16px; padding: 28px;
  border: 1px solid rgba(74,144,226,.3);
}
.parts-info-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.parts-code { font-size: 13px; color: rgba(255,255,255,.65); font-family: monospace; margin-bottom: 6px; }
.parts-name { font-size: 26px; font-weight: 700; color: white; }
.parts-badges { display: flex; gap: 10px; flex-wrap: wrap; }
.parts-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 12px; color: rgba(255,255,255,.6); }
.meta-value { font-size: 14px; color: white; font-weight: 500; }

.content-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }

.timeline-card, .certs-card {
  background: #ffffff; border-radius: 16px;
  padding: 24px; border: 1px solid #e2e8f0;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; color: #1e293b;
  margin-bottom: 24px;
}
.section-count { margin-left: auto; font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 2px 10px; border-radius: 10px; }

.timeline-content { background: #f1f5f9; border-radius: 10px; padding: 14px; }
.timeline-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.timeline-event-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.timeline-body { font-size: 13px; color: #475569; line-height: 1.8; margin-bottom: 10px; }
.tl-label { color: #94a3b8; }
.timeline-chain { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; }
.timeline-chain code { font-family: monospace; }

.mini-cert { margin-bottom: 14px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
.mini-cert-header { padding: 8px 14px; color: white; font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.mini-cert-header.production { background: #667eea; }
.mini-cert-header.quality { background: #16a34a; }
.mini-cert-header.logistics { background: #d97706; }
.mini-cert-body { padding: 12px 14px; background: #f1f5f9; }
.mini-cert-name { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.mini-cert-info { font-size: 12px; color: #475569; margin-bottom: 2px; }
.mini-cert-hash { font-size: 11px; font-family: monospace; color: #94a3b8; word-break: break-all; }

.chain-summary { margin-top: 20px; background: rgba(74,144,226,.06); border-radius: 10px; padding: 16px; border: 1px solid #dbeafe; }
.chain-summary-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #3b82f6; margin-bottom: 12px; font-size: 14px; }
.chain-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(74,144,226,.08); font-size: 13px; }
.chain-row span { color: #475569; }
.chain-row strong { color: #1e293b; }
.chain-row code { font-family: monospace; font-size: 11px; color: #94a3b8; }
.ok { color: #48bb78 !important; }

.empty-hint { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 100px 0; color: #94a3b8; font-size: 15px; }
.no-result { padding: 60px 0; }

:deep(.el-timeline-item__timestamp) { color: #94a3b8; }
:deep(.el-timeline-item__tail) { border-color: #e2e8f0; }
</style>
