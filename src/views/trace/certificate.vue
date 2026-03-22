<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数字凭证管理</h2>
    </div>

    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="搜索零部件编码/凭证名称" clearable style="width:260px"
        @clear="fetchCerts" @keyup.enter="fetchCerts">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="searchForm.certType" placeholder="凭证类型" clearable style="width:140px" @change="fetchCerts">
        <el-option label="生产证明" value="production" />
        <el-option label="质检报告" value="quality" />
        <el-option label="流转证明" value="logistics" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchCerts">搜索</el-button>
    </div>

    <div class="cert-grid">
      <div class="cert-card" v-for="cert in certList" :key="cert.id" @click="viewDetail(cert)">
        <div class="cert-header"  :class="cert.certificateType">
          <el-icon :size="32"><Tickets /></el-icon>
          <span class="cert-type-label">{{ certTypeLabel(cert.certificateType) }}</span>
          <div class="cert-verified" v-if="cert.verified">
            <el-icon><SuccessFilled /></el-icon> 已验证
          </div>
        </div>
        <div class="cert-body">
          <div class="cert-name">{{ cert.certificateName }}</div>
          <div class="cert-parts">零部件：{{ cert.partsCode }}</div>
          <div class="cert-issuer">签发方：{{ cert.issuer }}</div>
          <div class="cert-time">签发时间：{{ cert.issueTime }}</div>
          <div class="cert-hash">
            <span>Hash: </span>
            <code>{{ cert.certificateHash }}</code>
          </div>
        </div>
        <div class="cert-footer">
          <el-button size="small" type="primary" link @click.stop="verifyCert(cert)">验证凭证</el-button>
          <el-button size="small" link @click.stop="viewDetail(cert)">查看详情</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="certList.length === 0" description="暂无凭证数据" />

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="凭证详情" width="600px">
      <div v-if="currentCert" class="cert-detail">
        <div class="detail-badge" :class="currentCert.certificateType">
          {{ certTypeLabel(currentCert.certificateType) }}
        </div>
        <h3 class="detail-title">{{ currentCert.certificateName }}</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="零部件编码">{{ currentCert.partsCode }}</el-descriptions-item>
          <el-descriptions-item label="签发方">{{ currentCert.issuer }}</el-descriptions-item>
          <el-descriptions-item label="签发时间" :span="2">{{ currentCert.issueTime }}</el-descriptions-item>
          <el-descriptions-item label="凭证内容" :span="2">{{ currentCert.content }}</el-descriptions-item>
          <el-descriptions-item label="凭证Hash" :span="2">
            <code class="hash-code">{{ currentCert.certificateHash }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="区块Hash" :span="2">
            <code class="hash-code">{{ currentCert.blockHash }}</code>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Tickets, SuccessFilled } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'

const loading = ref(false)
const detailVisible = ref(false)
const certList = ref([])
const currentCert = ref(null)

const searchForm = reactive({ keyword: '', certType: '' })

const certTypeLabel = (t) => ({ production: '生产证明', quality: '质检报告', logistics: '流转证明' }[t] || t)

const fetchCerts = () => {
  loading.value = true
  setTimeout(() => {
    const res = mockData.getMockData('/api/trace/certificate/list', 'get')
    let list = res.data.list
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      list = list.filter(c => c.partsCode.includes(kw) || c.certificateName.includes(kw))
    }
    if (searchForm.certType) list = list.filter(c => c.certificateType === searchForm.certType)
    certList.value = list
    loading.value = false
  }, 300)
}

const viewDetail = (cert) => {
  currentCert.value = cert
  detailVisible.value = true
}

const verifyCert = (cert) => {
  ElMessage({
    message: `凭证 ${cert.certificateName} 验证通过，区块链数据完整性确认`,
    type: 'success',
    duration: 3000
  })
}

onMounted(fetchCerts)
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
.cert-header.logistics { background: #d97706; }

.cert-type-label { font-size: 16px; font-weight: 700; flex: 1; }

.cert-verified {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; background: rgba(255,255,255,.2);
  padding: 4px 10px; border-radius: 12px;
}

.cert-body { padding: 16px 20px; }
.cert-name { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 10px; }
.cert-parts, .cert-issuer, .cert-time { font-size: 13px; color: #475569; margin-bottom: 4px; }
.cert-hash { margin-top: 10px; font-size: 12px; color: #94a3b8; }
.cert-hash code { font-family: monospace; }

.cert-footer {
  padding: 10px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex; gap: 8px;
}

.cert-detail { padding: 4px; }
.detail-badge {
  display: inline-block; padding: 4px 14px; border-radius: 20px;
  font-size: 13px; font-weight: 600; margin-bottom: 12px; color: white;
}
.detail-badge.production { background: #667eea; }
.detail-badge.quality { background: #16a34a; }
.detail-badge.logistics { background: #d97706; }
.detail-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 20px; }
.hash-code { font-family: monospace; font-size: 12px; word-break: break-all; color: #3b82f6; }
:deep(.el-descriptions__label) { background: #f1f5f9; color: #475569; }
:deep(.el-descriptions__content) { background: #ffffff; color: #1e293b; }
</style>
