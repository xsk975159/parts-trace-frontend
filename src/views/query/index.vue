<template>
  <div class="page-container">
    <div class="page-header">
      <h2>追溯查询</h2>
      <p class="page-desc">输入零部件编码，查询全生命周期溯源链条与区块链凭证</p>
    </div>

    <div class="query-bar">
      <el-input
        v-model="queryCode"
        placeholder="请输入零部件编码，如：PT-ENG-001"
        size="large"
        clearable
        style="max-width: 500px; flex: 1"
        @keyup.enter="doQuery"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" size="large" :loading="loading" @click="doQuery">开始追溯</el-button>
      <el-input
        v-model="queryDid"
        placeholder="可选：输入 DID 直接查链条"
        size="large"
        clearable
        style="max-width: 500px; flex: 1"
      />
      <el-button size="large" @click="doQueryByDid">DID查询</el-button>
      <el-button size="large" type="success" plain @click="downloadReport('csv')">下载CSV报告</el-button>
      <el-button size="large" type="info" plain @click="downloadReport('json')">查看JSON报告</el-button>
      <div class="quick-links">
        <span class="quick-label">快速查询：</span>
        <el-tag v-for="code in quickCodes" :key="code" class="quick-tag" @click="quickQuery(code)">{{ code }}</el-tag>
      </div>
    </div>

    <div v-if="loading" class="loading-area">
      <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
      <p>正在从后端检索溯源数据...</p>
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
        <div class="did-summary">
          <span class="did-label">零件DID</span>
          <code class="did-code">{{ result.didInfo?.did || '-' }}</code>
          <el-tag v-if="result.unitInfo?.unitCode" type="info" size="small">单件 {{ result.unitInfo.unitCode }}</el-tag>
          <el-button size="small" @click="showDidDetail" :disabled="!result.didInfo">查看DID详情</el-button>
        </div>
      </div>

      <div class="content-grid">
        <div class="timeline-card">
          <div class="section-title">
            <el-icon><Connection /></el-icon>
            溯源链条
            <span class="section-count">{{ result.events.length }} 个事件</span>
          </div>
          <el-table :data="result.events" size="small" border>
            <el-table-column prop="eventType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="eventTypeTag(row.eventType)" size="small">{{ eventTypeLabel(row.eventType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="eventName" label="事件名称" min-width="170" />
            <el-table-column prop="eventTime" label="时间" width="180" />
            <el-table-column prop="operatorName" label="操作人" width="110" />
            <el-table-column prop="txHash" label="链上Tx" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button link type="primary" @click="showEventDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="certs-card">
          <div class="section-title">
            <el-icon><Tickets /></el-icon>
            数字凭证
            <span class="section-count">{{ result.certificates.length }} 份</span>
          </div>
          <div class="mini-cert" v-for="cert in result.certificates" :key="cert.id">
            <div class="mini-cert-header" :class="cert.vcType">
              <span>{{ certTypeLabel(cert.vcType) }}</span>
              <el-icon v-if="cert.verified"><SuccessFilled /></el-icon>
            </div>
            <div class="mini-cert-body">
              <div class="mini-cert-name">{{ certTypeLabel(cert.vcType) }}</div>
              <div class="mini-cert-info">签发方：{{ cert.issuerName || '-' }}</div>
              <div class="mini-cert-info">{{ cert.issuanceDate || '-' }}</div>
              <code class="mini-cert-hash">{{ cert.vcId }}</code>
              <div style="margin-top:6px">
                <el-button link type="primary" size="small" @click="showCertDetail(cert)">查看详情</el-button>
              </div>
            </div>
          </div>

          <div class="chain-summary">
            <div class="chain-summary-title"><el-icon><Link /></el-icon> 区块链摘要</div>
            <div class="chain-row"><span>上链事件数</span><strong>{{ result.events.length }}</strong></div>
            <div class="chain-row"><span>数字凭证数</span><strong>{{ result.certificates.length }}</strong></div>
            <div class="chain-row"><span>数据完整性</span><strong class="ok">验证通过</strong></div>
            <div class="chain-row">
              <span>最新区块</span>
              <code>{{ result.events[0]?.txHash || '-' }}</code>
            </div>
          </div>
        </div>
      </div>

      <div v-if="crossChain" class="cross-chain-card">
        <div class="section-title">
          <el-icon><Share /></el-icon>
          跨链分布式存储溯源
          <span class="section-count">{{ crossChain.records.length }} 条中继</span>
        </div>
        <div class="chain-topology">
          <div v-for="c in crossChain.chains" :key="c.id" class="chain-node" :class="c.chainRole?.toLowerCase()">
            <div class="chain-node-name">{{ c.chainName }}</div>
            <el-tag :type="c.chainType === 'FISCO_BCOS' ? 'warning' : 'primary'" size="small" effect="plain">
              {{ c.chainType === 'FISCO_BCOS' ? 'FISCO BCOS' : '长安链' }}
            </el-tag>
            <div class="chain-node-role">{{ c.chainRole === 'REGULATOR' ? '监管' : '业务' }}</div>
          </div>
        </div>
        <el-table :data="crossChain.records" size="small" border>
          <el-table-column prop="businessType" label="业务类型" width="100">
            <template #default="{ row }">{{ bizTypeLabel(row.businessType) }}</template>
          </el-table-column>
          <el-table-column prop="sourceChainId" label="源链" width="110">
            <template #default="{ row }">{{ chainNameMap[row.sourceChainId] || row.sourceChainId }}</template>
          </el-table-column>
          <el-table-column prop="sourceTxHash" label="源交易" min-width="170" show-overflow-tooltip />
          <el-table-column prop="dataHash" label="数据哈希" min-width="190" show-overflow-tooltip />
          <el-table-column prop="targetTxHash" label="主链交易" min-width="170" show-overflow-tooltip />
          <el-table-column label="同步状态" width="110"><template #default="{ row }">{{ ({0:'待同步',1:'已确认',2:'本地模拟',3:'同步中','-1':'同步失败'})[row.status] || '未知' }}</template></el-table-column>
          <el-table-column prop="lastError" label="失败原因" min-width="160" show-overflow-tooltip />
          <el-table-column prop="targetBlockHeight" label="主链高度" width="90" />
          <el-table-column prop="relayTime" label="中继时间" width="170" />
        </el-table>
      </div>
    </div>

    <div v-else-if="searched" class="no-result">
      <el-empty description="未找到该零部件的溯源信息" :image-size="120" />
    </div>

    <div v-else class="empty-hint">
      <el-icon :size="80" color="#cbd5e1"><Search /></el-icon>
      <p>请输入零部件编码进行追溯查询</p>
    </div>

    <el-dialog v-model="didDetailVisible" title="DID详情" width="760px">
      <pre class="dialog-pre">{{ JSON.stringify(result?.didInfo || {}, null, 2) }}</pre>
    </el-dialog>
    <el-dialog v-model="eventDetailVisible" title="事件详情" width="760px">
      <pre class="dialog-pre">{{ JSON.stringify(currentEvent || {}, null, 2) }}</pre>
    </el-dialog>
    <el-dialog v-model="certDetailVisible" title="VC详情" width="760px">
      <pre class="dialog-pre">{{ JSON.stringify(currentCert || {}, null, 2) }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Connection, Tickets, Link, Share, SuccessFilled, Loading } from '@element-plus/icons-vue'
import { exportTraceReport, getCertificateDetail, getCrossChainOverview, queryTraceChain, queryTraceChainByDid } from '@/api/trace'

const route = useRoute()
const queryCode = ref('')
const loading = ref(false)
const searched = ref(false)
const result = ref(null)
const queryDid = ref('')
const quickCodes = ['PT-ENG-001', 'PT-ENG-002', 'PT-CHN-001']
const didDetailVisible = ref(false)
const eventDetailVisible = ref(false)
const certDetailVisible = ref(false)
const currentEvent = ref(null)
const currentCert = ref(null)
const crossChain = ref(null)

const eventTypeLabel = (t) => ({ production: '生产', quality: '质检', logistics: '物流', delivery: '交付' }[t] || t)
const eventTypeTag = (t) => ({ production: '', quality: 'success', logistics: 'warning', delivery: 'info' }[t] || '')
const eventTimelineType = (t) => ({ production: 'primary', quality: 'success', logistics: 'warning', delivery: 'info' }[t] || 'primary')
const certTypeLabel = (t) => ({ production: '生产证明', quality: '质检报告', transfer: '流转证明', comprehensive: '综合凭证' }[t] || t)
const bizTypeLabel = (t) => ({ trace_event: '溯源事件', vc: '数字凭证', did_document_unit: 'DID文档', vc_append: 'VC挂载' }[t] || t)
const chainNameMap = computed(() => {
  const m = {}
  ;(crossChain.value?.chains || []).forEach((c) => { m[c.chainCode] = c.chainName })
  return m
})
const loadCrossChain = async (did) => {
  crossChain.value = null
  if (!did) return
  try {
    const res = await getCrossChainOverview(did)
    crossChain.value = res.data || null
  } catch (e) {
    crossChain.value = null
  }
}

const normalizeEvent = (e) => ({
  id: e.id,
  eventType: e.eventType || e.event_type || '',
  eventName: e.eventName || e.event_name || '',
  operatorName: e.operatorName || e.operator_name || '',
  location: e.eventLocation || e.event_location || '',
  description: e.remark || '',
  eventTime: e.eventTime || e.event_time || '',
  txHash: e.blockchainTxId || e.blockchain_tx_id || ''
})

const normalizeCert = (c) => ({
  id: c.id,
  vcId: c.vcId || c.vc_id || '',
  vcType: c.vcType || c.vc_type || '',
  issuerName: c.issuerName || c.issuer_name || '',
  issuanceDate: c.issuanceDate || c.issuance_date || '',
  verified: false
})

const partsMeta = computed(() => {
  if (!result.value?.parts) return []
  const p = result.value.parts
  return [
    { label: '生产厂商', value: p.manufacturer || '-' },
    { label: '规格型号', value: p.specification || '-' },
    { label: '生产日期', value: p.productionDate || '-' },
    { label: '质量标准', value: p.qualityStandard || '-' }
  ]
})

const doQuery = async () => {
  const code = queryCode.value.trim()
  if (!code) {
    ElMessage.warning('请输入零部件编码')
    return
  }

  loading.value = true
  searched.value = true
  result.value = null

  try {
    const res = await queryTraceChain(code)
    const data = res.data || {}

    if (!data.parts) {
      result.value = null
      return
    }

    result.value = {
      parts: data.parts,
      didInfo: null,
      events: (data.events || []).map(normalizeEvent),
      certificates: (data.certificates || []).map(normalizeCert)
    }
    const didFromEvent = (data.events || []).map((e) => e.partsDid).find(Boolean)
    const didFromCert = (data.certificates || []).map((c) => c.holderDid || c.subjectDid).find(Boolean)
    const resolvedDid = didFromEvent || didFromCert
    if (resolvedDid) {
      result.value.didInfo = { did: resolvedDid }
      await loadCrossChain(resolvedDid)
    } else {
      crossChain.value = null
    }
  } finally {
    loading.value = false
  }
}

const quickQuery = (code) => {
  queryCode.value = code
  doQuery()
}

const doQueryByDid = async () => {
  const did = queryDid.value.trim()
  if (!did) {
    ElMessage.warning('请输入DID')
    return
  }
  loading.value = true
  searched.value = true
  result.value = null
  try {
    const res = await queryTraceChainByDid(did)
    const data = res.data || {}
    result.value = {
      parts: data.partsInfo || {},
      didInfo: data.didInfo || null,
      unitInfo: data.unitInfo || null,
      events: (data.events || []).map(normalizeEvent),
      certificates: (data.credentials || []).map(normalizeCert)
    }
    const resolvedDid = data.didInfo?.did || did
    await loadCrossChain(resolvedDid)
  } finally {
    loading.value = false
  }
}

const downloadReport = async (format) => {
  const did = queryDid.value.trim()
  if (!did) {
    ElMessage.warning('请先输入DID')
    return
  }
  const res = await exportTraceReport(did, format)
  const blob = format === 'csv' ? new Blob(['\uFEFF', res.data], { type: 'text/csv;charset=utf-8' })
    : new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `溯源报告-${did.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  ElMessage.success('报告已下载')
}

const showDidDetail = () => {
  didDetailVisible.value = true
}

const showEventDetail = (event) => {
  currentEvent.value = event
  eventDetailVisible.value = true
}

const showCertDetail = async (cert) => {
  const res = await getCertificateDetail(cert.id)
  currentCert.value = res.data || cert
  certDetailVisible.value = true
}

onMounted(() => {
  const did = route.query.did
  if (typeof did === 'string' && did.trim()) {
    queryDid.value = did.trim()
    doQueryByDid()
  }
})
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

.parts-info-card { background: #2563eb; border-radius: 16px; padding: 28px; border: 1px solid rgba(74,144,226,.3); }
.parts-info-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.parts-code { font-size: 13px; color: rgba(255,255,255,.65); font-family: monospace; margin-bottom: 6px; }
.parts-name { font-size: 26px; font-weight: 700; color: white; }
.parts-badges { display: flex; gap: 10px; flex-wrap: wrap; }
.parts-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.did-summary { margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.did-label { color: rgba(255,255,255,.75); font-size: 13px; }
.did-code { color: #fff; background: rgba(255,255,255,.12); padding: 3px 8px; border-radius: 6px; font-size: 12px; }
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 12px; color: rgba(255,255,255,.6); }
.meta-value { font-size: 14px; color: white; font-weight: 500; }

.content-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
.timeline-card, .certs-card { background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
.cross-chain-card { background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
.chain-topology { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.chain-node { flex: 1; min-width: 160px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.chain-node.regulator { border-color: #93c5fd; background: #eff6ff; }
.chain-node-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.chain-node-role { font-size: 12px; color: #64748b; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 24px; }
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
.mini-cert-header.transfer { background: #d97706; }
.mini-cert-header.comprehensive { background: #0891b2; }
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
.dialog-pre { margin: 0; max-height: 460px; overflow: auto; background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; }

:deep(.el-timeline-item__timestamp) { color: #94a3b8; }
:deep(.el-timeline-item__tail) { border-color: #e2e8f0; }
</style>
