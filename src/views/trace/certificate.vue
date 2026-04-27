<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数字凭证管理</h2>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索零部件编码/签发方"
        clearable
        style="width: 260px"
        @clear="fetchCerts"
        @keyup.enter="fetchCerts"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="searchForm.certType" placeholder="凭证类型" clearable style="width: 140px" @change="fetchCerts">
        <el-option label="生产证明" value="production" />
        <el-option label="质检报告" value="quality" />
        <el-option label="流转证明" value="transfer" />
        <el-option label="综合凭证" value="comprehensive" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchCerts">搜索</el-button>
    </div>

    <div class="cert-grid" v-loading="loading">
      <div class="cert-card" v-for="cert in certList" :key="cert.id" @click="viewDetail(cert)">
        <div class="cert-header" :class="cert.vcType">
          <el-icon :size="32"><Tickets /></el-icon>
          <span class="cert-type-label">{{ certTypeLabel(cert.vcType) }}</span>
          <div class="cert-verified" v-if="cert.verified">
            <el-icon><SuccessFilled /></el-icon>
            已验证
          </div>
        </div>
        <div class="cert-body">
          <div class="cert-name">{{ cert.certificateName }}</div>
          <div class="cert-parts">零部件：{{ cert.partsCode || '-' }}</div>
          <div class="cert-issuer">签发方：{{ cert.issuerName || '-' }}</div>
          <div class="cert-time">签发时间：{{ cert.issuanceDate || '-' }}</div>
          <div class="cert-hash">
            <span>VC ID: </span>
            <code>{{ cert.vcId }}</code>
          </div>
        </div>
        <div class="cert-footer">
          <el-button size="small" type="primary" link @click.stop="verifyCert(cert)">验证凭证</el-button>
          <el-button size="small" link @click.stop="viewDetail(cert)">查看详情</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && certList.length === 0" description="暂无凭证数据" />

    <el-dialog v-model="detailVisible" title="凭证详情" width="700px">
      <div v-if="currentCert" class="cert-detail">
        <div class="detail-badge" :class="currentCert.vcType">{{ certTypeLabel(currentCert.vcType) }}</div>
        <h3 class="detail-title">{{ currentCert.certificateName }}</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="零部件编码">{{ currentCert.partsCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="签发方">{{ currentCert.issuerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="签发时间" :span="2">{{ currentCert.issuanceDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="过期时间" :span="2">{{ currentCert.expirationDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="凭证ID" :span="2">
            <code class="hash-code">{{ currentCert.vcId }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="凭证数据" :span="2">
            <code class="hash-code">{{ currentCert.credentialData || '-' }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="证明信息" :span="2">
            <code class="hash-code">{{ currentCert.proof || '-' }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="验证状态" :span="2">
            <el-tag :type="currentCert.verified ? 'success' : 'warning'">
              {{ currentCert.verified ? '已验证' : '未验证' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="verifyCert(currentCert)">验证凭证</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Tickets, SuccessFilled } from '@element-plus/icons-vue'
import { getCertificateDetail, getCertificateList, verifyCertificate } from '@/api/trace'
import { getPartsList } from '@/api/parts'

const loading = ref(false)
const detailVisible = ref(false)
const certList = ref([])
const currentCert = ref(null)
const partsCodeMap = ref({})

const searchForm = reactive({ keyword: '', certType: '' })

const certTypeLabel = (t) => ({
  production: '生产证明',
  quality: '质检报告',
  transfer: '流转证明',
  comprehensive: '综合凭证'
}[t] || t)

const normalizeCert = (c) => {
  const normalizedType = (c.vcType || c.vc_type || '').toLowerCase()
  const normalizedStatus = c.vcStatus ?? c.vc_status ?? c.status
  return {
    ...c,
    vcType: normalizedType,
    issuerName: c.issuerName || c.issuer_name || '',
    issuanceDate: c.issuanceDate || c.issuance_date || '',
    expirationDate: c.expirationDate || c.expiration_date || '',
    credentialData: c.credentialData || c.credential_data || '',
    partsCode: partsCodeMap.value[c.partsId] || '',
    certificateName: certTypeLabel(normalizedType),
    verified: Number(normalizedStatus) === 1
  }
}

const fetchPartsMap = async () => {
  const res = await getPartsList({ page: 1, pageSize: 1000 })
  const pageData = res.data || {}
  const list = pageData.records || pageData.list || []
  const map = {}
  list.forEach((p) => {
    map[p.id] = p.partsCode
  })
  partsCodeMap.value = map
}

const fetchCerts = async () => {
  loading.value = true
  try {
    const res = await getCertificateList({ page: 1, pageSize: 1000 })
    let list = (res.data?.list || []).map(normalizeCert)

    if (searchForm.keyword) {
      const kw = searchForm.keyword.trim().toLowerCase()
      list = list.filter((c) =>
        (c.partsCode || '').toLowerCase().includes(kw) ||
        (c.issuerName || '').toLowerCase().includes(kw)
      )
    }

    if (searchForm.certType) {
      list = list.filter((c) => c.vcType === searchForm.certType)
    }

    certList.value = list
  } finally {
    loading.value = false
  }
}

const viewDetail = async (cert) => {
  const res = await getCertificateDetail(cert.id)
  currentCert.value = normalizeCert(res.data || cert)
  detailVisible.value = true
}

const verifyCert = async (cert) => {
  const res = await verifyCertificate(cert.id)
  const ok = !!res.data?.verified
  ElMessage({
    message: ok ? `凭证 ${cert.vcId} 验证通过` : `凭证 ${cert.vcId} 验证未通过`,
    type: ok ? 'success' : 'warning',
    duration: 2500
  })

  if (currentCert.value && currentCert.value.id === cert.id) {
    currentCert.value.verified = ok
  }
}

onMounted(async () => {
  await fetchPartsMap()
  await fetchCerts()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.search-bar { display: flex; gap: 12px; }

.cert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.cert-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  transition: all .3s;
}
.cert-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.3); }

.cert-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  position: relative;
}
.cert-header.production { background: #667eea; }
.cert-header.quality { background: #16a34a; }
.cert-header.transfer { background: #d97706; }
.cert-header.comprehensive { background: #0891b2; }

.cert-type-label { font-size: 16px; font-weight: 700; flex: 1; }

.cert-verified {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  background: rgba(255,255,255,.2);
  padding: 4px 10px;
  border-radius: 12px;
}

.cert-body { padding: 16px 20px; }
.cert-name { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 10px; }
.cert-parts, .cert-issuer, .cert-time { font-size: 13px; color: #475569; margin-bottom: 4px; }
.cert-hash { margin-top: 10px; font-size: 12px; color: #94a3b8; }
.cert-hash code { font-family: monospace; }

.cert-footer {
  padding: 10px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
}

.cert-detail { padding: 4px; }
.detail-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  color: white;
}
.detail-badge.production { background: #667eea; }
.detail-badge.quality { background: #16a34a; }
.detail-badge.transfer { background: #d97706; }
.detail-badge.comprehensive { background: #0891b2; }

.detail-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 20px; }
.hash-code { font-family: monospace; font-size: 12px; word-break: break-all; color: #3b82f6; }
:deep(.el-descriptions__label) { background: #f1f5f9; color: #475569; }
:deep(.el-descriptions__content) { background: #ffffff; color: #1e293b; }
</style>
