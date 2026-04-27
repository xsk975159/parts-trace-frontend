<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>批次溯源工作台</h2>
        <p>以批次为边界：查看单件进度、登记事件与签发凭证；凭证与追溯页展示当前批次的汇总与存证摘要。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="批次进度" name="tasks">
        <div class="batch-toolbar">
          <el-button @click="openBatchPicker">选择批次</el-button>
          <el-tag v-if="selectedBatch" type="primary">{{ selectedBatch }}</el-tag>
          <el-button type="primary" @click="gotoRecordCenter">去批次执行</el-button>
          <el-tag type="info">总数 {{ batchSummary.totalParts || 0 }}</el-tag>
          <el-tag type="success">完成 {{ batchSummary.completedParts || 0 }}</el-tag>
          <el-tag :type="(batchSummary.completionRate || 0) >= 80 ? 'success' : 'warning'">完成率 {{ batchSummary.completionRate || 0 }}%</el-tag>
        </div>
        <el-table :data="batchItems" v-loading="loadingTasks" @row-click="handleBoardRowClick">
          <el-table-column prop="unitCode" label="单件编码" width="170" />
          <el-table-column prop="partsId" label="partsId" width="90" />
          <el-table-column prop="partsCode" label="零部件编码" width="140" />
          <el-table-column prop="partsName" label="零部件名称" min-width="160" />
          <el-table-column prop="did" label="DID" min-width="260" show-overflow-tooltip />
          <el-table-column prop="stage" label="当前阶段" width="120" />
          <el-table-column label="流程进度" width="180">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column prop="eventCount" label="事件数" width="90" />
          <el-table-column prop="vcCount" label="VC数" width="90" />
          <el-table-column prop="latestEventType" label="最近事件类型" width="120" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="handleBoardRowClick(row)">查看链路</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-card class="event-vc-card">
          <template #header>单件链路看板</template>
          <div v-if="boardDetailVisible && boardSelected" class="board-summary">
            <el-tag type="primary">{{ boardSelected.unitCode || '-' }}</el-tag>
            <el-tag type="info">DID：{{ boardSelected.did || '-' }}</el-tag>
            <el-tag type="success">阶段：{{ boardSelected.stage || '-' }}</el-tag>
            <el-tag type="warning">事件 {{ boardSelected.eventCount || 0 }}</el-tag>
            <el-tag>VC {{ boardSelected.vcCount || 0 }}</el-tag>
          </div>
          <el-table :data="selectedUnitTraceRows" size="small" border v-if="boardDetailVisible && boardSelected">
            <el-table-column prop="eventType" label="事件类型" width="120" />
            <el-table-column prop="eventName" label="事件名称" min-width="170" />
            <el-table-column prop="eventTime" label="事件时间" width="180" />
            <el-table-column prop="vcTypeText" label="VC类型" width="110" />
            <el-table-column label="VC ID" min-width="240">
              <template #default="{ row }">
                <el-button v-if="row.vcId" link type="primary" @click="openVcDetail(row)">{{ row.vcId }}</el-button>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.vcId ? 'success' : 'info'" size="small">{{ row.vcId ? '已关联' : '未关联' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="boardDetailVisible && boardSelected && !selectedUnitTraceRows.length" description="该单件暂无事件/VC链路数据" :image-size="56" />
          <el-empty v-if="!boardDetailVisible" description="请先点击“查看链路”查看单件完整过程" :image-size="56" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="批次执行" name="record">
        <div class="record-layout">
          <div class="record-main">
            <el-card class="batch-status-card" v-if="form.batchNumber">
              <div class="batch-status-row">
                <el-tag type="primary">当前批次：{{ form.batchNumber }}</el-tag>
                <el-tag type="info">总单件 {{ batchSummary.totalParts || 0 }}</el-tag>
                <el-tag type="success">已完成 {{ batchSummary.completedParts || 0 }}</el-tag>
                <el-tag :type="(batchSummary.completionRate || 0) >= 80 ? 'success' : 'warning'">完成率 {{ batchSummary.completionRate || 0 }}%</el-tag>
                <el-tag :type="currentPhaseTag">{{ currentPhaseText }}</el-tag>
              </div>
              <div class="batch-status-row">
                <el-tag type="warning">本次可处理 {{ eligibleCount }} 件</el-tag>
                <el-tag v-if="ineligibleCount > 0" type="danger">将跳过 {{ ineligibleCount }} 件</el-tag>
                <span class="status-tip">{{ eligibilityHint }}</span>
              </div>
              <div v-if="form.batchNumber" class="batch-meta-hint">主数据 {{ partsInfoRowCount }} 条 · 单件共 {{ batchItems.length }} 件</div>
            </el-card>
            <el-form
              ref="formRef"
              class="record-main-form"
              :model="form"
              :rules="rules"
              label-width="110px"
              label-position="left"
            >
              <el-form-item label="批次号" prop="batchNumber">
                <div class="batch-picker-inline">
                  <el-input v-model="form.batchNumber" readonly placeholder="请先选择批次" />
                  <el-button @click="openBatchPicker">选择批次</el-button>
                </div>
              </el-form-item>
              <el-form-item v-if="showPartsInfoPicker" label="零部件主数据">
                <el-select
                  v-model="form.partsInfoIds"
                  multiple
                  filterable
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 100%"
                  placeholder="默认全选，可取消以缩小本单范围"
                >
                  <el-option
                    v-for="p in effectivePartsList"
                    :key="p.id"
                    :label="partsSelectLabel(p)"
                    :value="p.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="事件类型" prop="eventType">
                <el-segmented v-model="form.eventType" :options="eventTypeOptions" />
              </el-form-item>
              <el-form-item label="事件名称" prop="eventName">
                <el-input v-model="form.eventName" placeholder="如：生产下线/初检/发货" />
              </el-form-item>
              <el-row :gutter="10" class="operator-time-row">
                <el-col :span="8">
                  <el-form-item label="操作人ID" prop="operatorId" label-width="86px">
                    <el-input-number v-model="form.operatorId" :min="1" :controls="false" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="操作人" prop="operatorName" label-width="72px">
                    <el-input v-model="form.operatorName" placeholder="默认当前登录用户" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="发生时间" prop="eventTime" label-width="86px">
                    <el-date-picker
                      v-model="form.eventTime"
                      type="datetime"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <p v-if="currentUser" class="operator-fill-hint">已根据当前登录账号预填，可按需修改。</p>
              <el-form-item label="机构">
                <el-input v-model="form.organization" />
              </el-form-item>
              <el-form-item label="地点">
                <el-input v-model="form.eventLocation" />
              </el-form-item>
              <el-form-item label="附件URL">
                <el-input v-model="form.evidenceUrls" placeholder="可填多个URL，逗号分隔" />
              </el-form-item>

              <el-divider>类型专属字段</el-divider>
              <template v-if="form.eventType === 'production'">
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="产线"><el-input v-model="form.productionLine" /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="生产批次"><el-input v-model="form.productionBatch" /></el-form-item></el-col>
                </el-row>
              </template>
              <template v-if="form.eventType === 'quality'">
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="检验类型"><el-input v-model="form.inspectionType" /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="检验结果"><el-input v-model="form.inspectionResult" /></el-form-item></el-col>
                </el-row>
              </template>
              <template v-if="form.eventType === 'logistics'">
                <el-row :gutter="12">
                  <el-col :span="12"><el-form-item label="物流类型"><el-input v-model="form.logisticsType" /></el-form-item></el-col>
                  <el-col :span="12"><el-form-item label="运单号"><el-input v-model="form.trackingNumber" /></el-form-item></el-col>
                </el-row>
              </template>

              <el-form-item label="操作策略">
                <el-checkbox v-model="form.issueVc">处理完成后按勾选签发 VC</el-checkbox>
              </el-form-item>
              <el-alert
                v-if="form.batchNumber"
                type="info"
                :closable="false"
                :title="`执行预览：将处理 ${eligibleCount} 件，跳过 ${ineligibleCount} 件`"
                show-icon
                class="preview-alert"
              />
              <el-form-item label="提交">
                <div class="submit-actions">
                  <el-button type="primary" :loading="submitting" @click="submitRecord('continue')">执行批次处理</el-button>
                  <el-button type="success" :loading="submitting" @click="submitRecord('vc')">执行并签发 VC</el-button>
                </div>
                <p class="submit-hint">一次提交会处理当前范围内、符合当前事件类型的全部单件，不会逐条跳转；左侧勾选决定是否签发 VC，右侧按钮可无视勾选强制签发。</p>
              </el-form-item>
            </el-form>
          </div>

          <div class="record-side">
            <el-card>
              <template #header>批次上下文</template>
              <div v-if="recordBatchContext">
                <div class="kv"><span>批次号</span><strong>{{ recordBatchContext.batchNumber }}</strong></div>
                <div class="kv"><span>零部件记录数</span><strong>{{ recordBatchContext.partsRowCount }}</strong></div>
                <div class="kv"><span>零部件ID</span><strong>{{ recordBatchContext.partsIdSummary }}</strong></div>
                <div class="kv"><span>编码</span><strong>{{ recordBatchContext.partsCode }}</strong></div>
                <div class="kv"><span>名称</span><strong>{{ recordBatchContext.partsName }}</strong></div>
                <div class="kv"><span>生产厂商</span><strong>{{ recordBatchContext.manufacturer }}</strong></div>
                <div class="kv"><span>计划数量(件)</span><strong>{{ recordBatchContext.plannedQuantity }}</strong></div>
                <div class="kv"><span>单件数(已落库)</span><strong>{{ recordBatchContext.unitCount }}</strong></div>
                <el-alert
                  v-if="recordBatchContext.quantityMismatch"
                  type="warning"
                  :closable="false"
                  show-icon
                  class="ctx-alert"
                  title="计划与已落库单件数不一致，请在零部件管理中核对。"
                />
              </div>
              <el-empty v-else description="请先选择批次" :image-size="72" />
            </el-card>

            <el-card>
              <template #header>DID（本批次）</template>
              <div class="did-box">
                <div class="did-section-title">范围统计</div>
                <div class="kv"><span>已生成 DID</span><strong>{{ batchDidStats.withDid }}/{{ batchDidStats.total }}</strong></div>
                <div class="kv"><span>已激活</span><el-tag type="success" size="small">{{ batchDidStats.active }}</el-tag></div>
                <div class="kv"><span>待补齐</span><el-tag :type="batchDidStats.need > 0 ? 'warning' : 'info'" size="small">{{ batchDidStats.need }}</el-tag></div>

                <el-divider content-position="left">批量</el-divider>
                <p class="side-hint did-hint-tight">按当前批次与主数据范围，为缺 DID 的零部件主数据生成 DID。查看文档、链上校验等请到 DID 管理。</p>
                <div class="did-actions">
                  <el-button size="small" type="success" @click="batchGenerateDid" :disabled="!form.batchNumber">批量补齐 DID</el-button>
                  <el-button size="small" link type="primary" @click="$router.push('/parts/did')">DID 管理</el-button>
                </div>
              </div>
            </el-card>

            <el-card>
              <template #header>流程状态</template>
              <el-steps direction="vertical" :active="statusStep">
                <el-step title="事件存证" :description="statusEvent" />
                <el-step title="VC签发" :description="statusVc" />
                <el-step title="链条更新" :description="statusChain" />
              </el-steps>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="凭证与追溯" name="followup">
        <div class="followup-tab" v-loading="loadingTasks">
          <el-empty
            v-if="!selectedBatch"
            description="请先在「批次进度」选择批次。加载后此处展示本批次事件/凭证摘要与累计指标。"
            :image-size="80"
          />
          <template v-else>
            <div class="followup-head">
              <el-tag type="primary" size="large">{{ selectedBatch }}</el-tag>
              <span class="followup-head-text">与「批次进度」「批次执行」共用当前批次数据；切换 Tab 时会自动刷新摘要。</span>
            </div>

            <el-card shadow="never" class="followup-card">
              <template #header>批次累计指标</template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="单件总数">{{ batchSummary.totalParts ?? 0 }}</el-descriptions-item>
                <el-descriptions-item label="已完成单件">{{ batchSummary.completedParts ?? 0 }}</el-descriptions-item>
                <el-descriptions-item label="完成率">{{ batchSummary.completionRate ?? 0 }}%</el-descriptions-item>
                <el-descriptions-item label="单件维度累计事件数">{{ batchAggregateStats.totalEvents }}</el-descriptions-item>
                <el-descriptions-item label="单件维度累计 VC 数">{{ batchAggregateStats.totalVc }}</el-descriptions-item>
                <el-descriptions-item label="本页列出的存证事件行数">{{ (batchEventVcRows || []).length }}</el-descriptions-item>
                <el-descriptions-item label="其中已关联 VC 的行数">{{ batchEventVcLinkedCount }}</el-descriptions-item>
              </el-descriptions>
              <p class="followup-note">「累计事件/VC」来自各单件行的汇总；下方表格为与本批次零部件相关的存证事件列表（可与凭证管理交叉核对）。</p>
            </el-card>

            <el-card shadow="never" class="followup-card">
              <template #header>本批次存证事件与凭证</template>
              <el-table v-if="(batchEventVcRows || []).length" :data="batchEventVcRows" size="small" border max-height="360">
                <el-table-column prop="unitCode" label="单件编码" width="150" />
                <el-table-column prop="eventType" label="事件类型" width="100" />
                <el-table-column prop="eventName" label="事件名称" min-width="140" />
                <el-table-column prop="eventTime" label="事件时间" width="170" />
                <el-table-column prop="vcTypeText" label="VC 类型" width="100" />
                <el-table-column label="VC ID" min-width="200">
                  <template #default="{ row }">
                    <el-button v-if="row.vcId" link type="primary" @click="openVcDetail(row)">{{ row.vcId }}</el-button>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="关联" width="88">
                  <template #default="{ row }">
                    <el-tag :type="row.vcId ? 'success' : 'info'" size="small">{{ row.vcId ? '已关联' : '未关联' }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="本批次暂无匹配的存证事件，或主数据尚未同步。可先完成「批次执行」中的事件登记。" :image-size="64" />
            </el-card>

            <el-card shadow="never" class="followup-card">
              <template #header>扩展能力</template>
              <p class="followup-ext-intro">下列入口为全量功能页，支持按条件筛选、批量验证、按 DID 查链与导出报告（不限于当前批次）。</p>
              <div class="followup-actions">
                <el-button type="primary" @click="$router.push('/trace/certificate')">凭证管理</el-button>
                <el-button type="primary" plain @click="$router.push('/query')">追溯查询</el-button>
                <el-button @click="$router.push('/trace/event')">事件记录</el-button>
              </div>
            </el-card>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="vcDetailVisible" title="VC凭证详情" width="760px">
      <div v-loading="vcDetailLoading">
        <el-descriptions v-if="currentVcDetail" :column="2" border>
          <el-descriptions-item label="VC ID" :span="2"><code>{{ currentVcDetail.vcId || currentVcDetail.vc_id || '-' }}</code></el-descriptions-item>
          <el-descriptions-item label="VC 类型">{{ currentVcDetail.vcType || currentVcDetail.vc_type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentVcDetail.vcStatus ?? currentVcDetail.vc_status ?? currentVcDetail.status ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="签发方">{{ currentVcDetail.issuerName || currentVcDetail.issuer_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="签发方DID">{{ currentVcDetail.issuerDid || currentVcDetail.issuer_did || '-' }}</el-descriptions-item>
          <el-descriptions-item label="持有方DID" :span="2">{{ currentVcDetail.holderDid || currentVcDetail.holder_did || currentVcDetail.subjectDid || currentVcDetail.subject_did || '-' }}</el-descriptions-item>
          <el-descriptions-item label="签发时间">{{ currentVcDetail.issuanceDate || currentVcDetail.issuance_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">{{ currentVcDetail.expirationDate || currentVcDetail.expiration_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="链上交易ID" :span="2"><code>{{ currentVcDetail.blockchainTxId || currentVcDetail.blockchain_tx_id || '-' }}</code></el-descriptions-item>
          <el-descriptions-item label="VC 哈希" :span="2"><code>{{ currentVcDetail.vcHash || currentVcDetail.vc_hash || '-' }}</code></el-descriptions-item>
          <el-descriptions-item label="VC CID" :span="2"><code>{{ currentVcDetail.vcCid || currentVcDetail.vc_cid || '-' }}</code></el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <div class="vc-json-title">VC原文/证明</div>
        <pre class="doc">{{ JSON.stringify({ credentialData: currentVcDetail?.credentialData || currentVcDetail?.credential_data, proof: currentVcDetail?.proof }, null, 2) }}</pre>
      </div>
    </el-dialog>
    <el-dialog v-model="batchPickerVisible" title="选择批次" width="920px">
      <el-table :data="batchPickerPagedRows" size="small" border>
        <el-table-column prop="batchNumber" label="批次号" width="170" />
        <el-table-column prop="partsCode" label="示例零件编码" width="140" />
        <el-table-column prop="partsName" label="示例零件名称" min-width="160" />
        <el-table-column prop="manufacturer" label="生产厂商" min-width="180" />
        <el-table-column prop="batchQuantity" label="批次数量" width="110" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="selectBatch(row.batchNumber)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="picker-pagination">
        <el-pagination
          v-model:current-page="batchPickerPage"
          v-model:page-size="batchPickerSize"
          :total="batchPickerRows.length"
          :page-sizes="[10,20,50]"
          layout="total,sizes,prev,pager,next"
          background
        />
      </div>
    </el-dialog>
    <el-drawer v-model="resultDrawerVisible" title="批量执行结果" size="780px">
      <div class="result-head">
        <el-tag type="success">成功 {{ lastResult.success || 0 }}</el-tag>
        <el-tag :type="(lastResult.failed || 0) > 0 ? 'danger' : 'info'">失败 {{ lastResult.failed || 0 }}</el-tag>
        <el-button type="primary" :disabled="!(lastResult.failed > 0)" @click="retryFailed">一键重试失败件</el-button>
      </div>
      <el-table :data="lastResult.failures || []" size="small" border>
        <el-table-column prop="unitId" label="unitId" width="90" />
        <el-table-column prop="unitCode" label="单件编码" width="180" />
        <el-table-column prop="message" label="失败原因" min-width="260" />
      </el-table>
      <el-empty v-if="!(lastResult.failures || []).length" description="本次无失败单件" :image-size="60" />
    </el-drawer>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { getPartsList } from '@/api/parts'
import { generateDidSync } from '@/api/did'
import { getCertificateDetail, getCertificateList, getEventList, getWorkbenchBatchOverview, getWorkbenchBatches, submitWorkbenchBatchAction } from '@/api/trace'

const store = useStore()
const currentUser = computed(() => store.state.user.userInfo)

const activeTab = ref('record')
const loadingTasks = ref(false)
const batches = ref([])
const selectedBatch = ref('')
const batchItems = ref([])
const batchSummary = reactive({ totalParts: 0, completedParts: 0, completionRate: 0 })
const allParts = ref([])
const recordParts = ref([])
/** 来自 batch-overview 接口的批次主数据，避免仅依赖零部件列表分页导致条数不准 */
const batchOverviewMeta = reactive({
  partsInfoRowCount: 0,
  plannedQuantitySum: 0,
  partsInfoRows: []
})
const vcDetailVisible = ref(false)
const vcDetailLoading = ref(false)
const currentVcDetail = ref(null)
const batchPickerVisible = ref(false)
const batchPickerPage = ref(1)
const batchPickerSize = ref(10)
const submitting = ref(false)
const formRef = ref(null)
const resultDrawerVisible = ref(false)
const lastPayload = ref(null)
const lastResult = reactive({ success: 0, failed: 0, failures: [] })
const batchEventVcRows = ref([])
const boardSelected = ref(null)
const boardDetailVisible = ref(false)
const selectedUnitTraceRows = ref([])

const statusEvent = ref('待执行')
const statusVc = ref('待执行')
const statusChain = ref('待执行')
const statusStep = computed(() => {
  if (statusChain.value.includes('完成')) return 3
  if (statusVc.value.includes('完成') || statusVc.value.includes('跳过')) return 2
  if (statusEvent.value.includes('完成')) return 1
  return 0
})

const form = reactive({
  batchNumber: '',
  /** 当前批次选中的 parts_info.id 列表；单主数据时由接口同步为单元素，多主数据时默认全选 */
  partsInfoIds: [],
  eventType: 'production',
  eventName: '',
  operatorId: 1,
  operatorName: '',
  organization: '',
  eventLocation: '',
  eventTime: '',
  evidenceUrls: '',
  issueVc: true,
  productionLine: '',
  productionBatch: '',
  inspectionType: '',
  inspectionResult: '',
  logisticsType: '',
  trackingNumber: ''
})

const applyOperatorFromUser = () => {
  const u = currentUser.value
  if (!u) return
  const rawId = u.id ?? u.userId
  if (rawId != null && rawId !== '') {
    const n = Number(rawId)
    if (!Number.isNaN(n) && n >= 1) {
      form.operatorId = n
    }
  }
  const name = (u.realName || u.username || '').trim()
  if (name) {
    form.operatorName = name
  }
}

watch(currentUser, () => applyOperatorFromUser(), { immediate: true })

const rules = {
  batchNumber: [{ required: true, message: '请选择批次号', trigger: 'change' }],
  eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  eventName: [{ required: true, message: '请输入事件名称', trigger: 'blur' }],
  operatorId: [{ required: true, message: '请输入操作人ID', trigger: 'change' }],
  operatorName: [{ required: true, message: '请输入操作人', trigger: 'blur' }],
  eventTime: [{ required: true, message: '请选择时间', trigger: 'change' }]
}

const eventTypeOptions = [
  { label: '生产', value: 'production' },
  { label: '质检', value: 'quality' },
  { label: '物流', value: 'logistics' }
]

const vcTypeText = (t) => ({ production: '生产', quality: '质检', transfer: '物流', comprehensive: '综合' }[(t || '').toLowerCase()] || '-')
const phaseOrder = { none: 0, production: 1, quality: 2, logistics: 3, done: 4 }

/** 下拉选项：优先接口返回的 parts_info 全量，其次本地缓存的零部件列表 */
const effectivePartsList = computed(() => {
  if (batchOverviewMeta.partsInfoRows?.length) return batchOverviewMeta.partsInfoRows
  return recordParts.value || []
})

const partsInfoRowCount = computed(() => batchOverviewMeta.partsInfoRows?.length || 0)
const showPartsInfoPicker = computed(() => partsInfoRowCount.value > 1)

/** 按当前选中的主数据范围过滤后的单件（用于阶段、可处理数、DID 统计等） */
const batchItemsInScope = computed(() => {
  const items = batchItems.value || []
  const ids = form.partsInfoIds
  if (showPartsInfoPicker.value && (!ids || !ids.length)) return []
  if (!ids?.length) return items
  const set = new Set(ids.map(Number))
  return items.filter((r) => set.has(Number(r.partsId)))
})

/** 按 partsId 统计本批次已落库单件数（与溯源看板一致） */
const unitCountByPartsId = computed(() => {
  const m = new Map()
  for (const r of batchItems.value || []) {
    const id = r.partsId
    if (id == null) continue
    m.set(id, (m.get(id) || 0) + 1)
  }
  return m
})

const partsSelectLabel = (p) => {
  const n = unitCountByPartsId.value.get(p.id) ?? 0
  const q = p.quantity != null ? Number(p.quantity) : null
  const qStr = q != null && !Number.isNaN(q) ? `计划${q}` : '计划-'
  return `${p.partsCode || '-'} | ${qStr} | 落库${n} | ${p.partsName || '-'}`
}

/** 记录中心侧栏：当前批次下的零部件主数据汇总（非单件） */
const recordBatchContext = computed(() => {
  const bn = form.batchNumber
  if (!bn) return null
  const rows = effectivePartsList.value || []
  const unitCount = batchItems.value?.length || batchSummary.totalParts || 0
  const fromApi = batchOverviewMeta.partsInfoRows?.length > 0
  const partsRowCount = fromApi ? batchOverviewMeta.partsInfoRowCount : rows.length
  const plannedQuantity = fromApi
    ? Number(batchOverviewMeta.plannedQuantitySum || 0)
    : rows.reduce((s, p) => s + Number(p.quantity || 0), 0)
  const quantityMismatch = Math.abs(plannedQuantity - unitCount) > 0.0001
  if (!rows.length) {
    return {
      batchNumber: bn,
      partsRowCount: partsRowCount || 0,
      partsIdSummary: '-',
      partsCode: '-',
      partsName: '-',
      manufacturer: '-',
      plannedQuantity,
      unitCount,
      quantityMismatch
    }
  }
  const first = rows[0]
  const ids = rows.map((p) => p.id).join('、')
  return {
    batchNumber: bn,
    partsRowCount,
    partsIdSummary: rows.length === 1 ? String(first.id) : ids,
    partsCode: first.partsCode || '-',
    partsName: rows.length === 1 ? (first.partsName || '-') : `${first.partsName || '-'} 等${rows.length}条`,
    manufacturer: first.manufacturer || '-',
    plannedQuantity,
    unitCount,
    quantityMismatch
  }
})

/** 本批次单件 DID 覆盖情况（受主数据勾选范围约束） */
const batchDidStats = computed(() => {
  const items = batchItemsInScope.value || []
  const total = items.length
  const withDid = items.filter((r) => r.did).length
  const active = items.filter((r) => r.did && r.didStatus === 1).length
  const need = items.filter((r) => !r.did || r.didStatus === 3).length
  return { total, withDid, active, need }
})

/** 单件表维度：事件数、VC 数汇总（与下方存证行列表口径不同，见页面说明） */
const batchAggregateStats = computed(() => {
  const items = batchItems.value || []
  let totalEvents = 0
  let totalVc = 0
  for (const r of items) {
    totalEvents += Number(r.eventCount || 0)
    totalVc += Number(r.vcCount || 0)
  }
  return { totalEvents, totalVc }
})

const batchEventVcLinkedCount = computed(
  () => (batchEventVcRows.value || []).filter((r) => r.vcId).length
)

const batchPickerRows = computed(() => {
  const map = new Map()
  ;(allParts.value || []).forEach((p) => {
    const batch = p.batchNumber || ''
    if (!batch) return
    if (!map.has(batch)) {
      map.set(batch, {
        batchNumber: batch,
        partsCode: p.partsCode || '-',
        partsName: p.partsName || '-',
        manufacturer: p.manufacturer || '-',
        batchQuantity: 0
      })
    }
    map.get(batch).batchQuantity += Number(p.quantity || 0)
  })
  return [...map.values()].sort((a, b) => String(b.batchNumber).localeCompare(String(a.batchNumber)))
})
const batchPickerPagedRows = computed(() => {
  const start = (batchPickerPage.value - 1) * batchPickerSize.value
  return batchPickerRows.value.slice(start, start + batchPickerSize.value)
})

const unitCurrentPhase = (row) => {
  if (!row?.did || row?.didStatus === 2) return 'none'
  const t = (row?.latestEventType || '').toLowerCase()
  if (row?.vcCount > 0 && t === 'logistics') return 'done'
  if (t === 'quality') return 'logistics'
  if (t === 'production') return 'quality'
  return 'production'
}

const currentPhaseText = computed(() => {
  const scope = batchItemsInScope.value
  if (!scope.length) return '暂无可作业单件'
  const minPhase = scope
    .map((r) => unitCurrentPhase(r))
    .reduce((acc, p) => (phaseOrder[p] < phaseOrder[acc] ? p : acc), 'done')
  return ({
    none: '待DID激活',
    production: '待生产事件',
    quality: '待质检事件',
    logistics: '待物流事件',
    done: '全流程完成'
  })[minPhase]
})
const currentPhaseTag = computed(() => {
  const t = currentPhaseText.value
  if (t.includes('完成')) return 'success'
  if (t.includes('待DID')) return 'danger'
  return 'warning'
})
const eligibleRows = computed(() => {
  const target = form.eventType
  return batchItemsInScope.value.filter((r) => {
    if (!r.did || r.didStatus === 2) return false
    const p = unitCurrentPhase(r)
    return p === target
  })
})
const eligibleCount = computed(() => eligibleRows.value.length)
const ineligibleCount = computed(() => Math.max((batchItemsInScope.value || []).length - eligibleRows.value.length, 0))
const eligibilityHint = computed(() => {
  const t = form.eventType
  if (t === 'production') return '生产仅处理已激活 DID 且尚未记录生产事件的单件'
  if (t === 'quality') return '质检仅处理已完成生产事件的单件'
  return '物流仅处理已完成质检事件的单件'
})

const normalizePartRow = (r, batchNumber) => ({
  id: Number(r.id),
  partsCode: r.partsCode ?? r.parts_code ?? '-',
  partsName: r.partsName ?? r.parts_name ?? '-',
  batchNumber: r.batchNumber ?? r.batch_number ?? batchNumber ?? '',
  manufacturer: r.manufacturer ?? '-',
  quantity: r.quantity != null && r.quantity !== '' ? Number(r.quantity) : null
})

/** 合并接口返回与按批次分页拉取的 parts_info，避免列表只含首页 1000 条导致漏批次记录 */
const mergePartsInfoRows = (apiRaw, localRaw, batchNumber) => {
  const map = new Map()
  for (const r of [...(apiRaw || []), ...(localRaw || [])]) {
    const id = Number(r?.id)
    if (r?.id == null || Number.isNaN(id)) continue
    if (!map.has(id)) map.set(id, normalizePartRow(r, batchNumber))
  }
  return [...map.values()].sort((a, b) => a.id - b.id)
}

const loadRecordPartsForBatch = async (batchNumber) => {
  if (!batchNumber) {
    recordParts.value = []
    return
  }
  const res = await getPartsList({ page: 1, pageSize: 500, batchNumber })
  const pageData = res.data || {}
  recordParts.value = pageData.records || pageData.list || []
}

const fetchParts = async () => {
  const res = await getPartsList({ page: 1, pageSize: 1000 })
  const pageData = res.data || {}
  allParts.value = pageData.records || pageData.list || []
}

const fetchTasks = async () => {
  loadingTasks.value = true
  try {
    const res = await getWorkbenchBatches()
    batches.value = res.data || []
    if (!selectedBatch.value && batches.value.length > 0) {
      selectedBatch.value = batches.value[0]
      form.batchNumber = selectedBatch.value
    }
    if (selectedBatch.value) {
      await fetchBatchOverview(selectedBatch.value)
    }
  } finally {
    loadingTasks.value = false
  }
}

const fetchBatchOverview = async (batchNumber = selectedBatch.value) => {
  if (!batchNumber) return
  const res = await getWorkbenchBatchOverview(batchNumber)
  const data = res.data || {}
  batchItems.value = data.items || []
  batchSummary.totalParts = data.totalParts || 0
  batchSummary.completedParts = data.completedParts || 0
  batchSummary.completionRate = data.completionRate || 0
  const apiRaw = data.partsInfoRows || []
  await loadRecordPartsForBatch(batchNumber)
  const localRaw = recordParts.value || []
  batchOverviewMeta.partsInfoRows = mergePartsInfoRows(apiRaw, localRaw, batchNumber)
  batchOverviewMeta.partsInfoRowCount = batchOverviewMeta.partsInfoRows.length
  batchOverviewMeta.plannedQuantitySum = batchOverviewMeta.partsInfoRows.reduce(
    (s, p) => s + (p.quantity != null && !Number.isNaN(p.quantity) ? p.quantity : 0),
    0
  )
  syncPartsInfoSelection()
  if (boardSelected.value) {
    boardSelected.value = batchItems.value.find((i) => i.unitId === boardSelected.value.unitId) || null
    if (!boardSelected.value) {
      boardDetailVisible.value = false
      selectedUnitTraceRows.value = []
    }
  }
  await loadBatchEventVcRows()
}

const syncPartsInfoSelection = () => {
  const rows = batchOverviewMeta.partsInfoRows || []
  const n = rows.length
  if (n === 0) {
    form.partsInfoIds = []
  } else if (n === 1) {
    form.partsInfoIds = [Number(rows[0].id)]
  } else {
    form.partsInfoIds = rows.map((r) => Number(r.id))
  }
}

const gotoRecordCenter = async () => {
  if (!selectedBatch.value) {
    ElMessage.warning('请先选择批次')
    return
  }
  activeTab.value = 'record'
  form.batchNumber = selectedBatch.value
  await fetchBatchOverview(selectedBatch.value)
}

const batchGenerateDid = async () => {
  const targetBatch = form.batchNumber || selectedBatch.value
  if (!targetBatch) {
    ElMessage.warning('请先选择批次')
    return
  }
  if (selectedBatch.value !== targetBatch) {
    selectedBatch.value = targetBatch
    await fetchBatchOverview(targetBatch)
  }
  if (showPartsInfoPicker.value && !(form.partsInfoIds || []).length) {
    ElMessage.warning('请至少勾选一条主数据')
    return
  }
  let needRows = (batchItems.value || []).filter((r) => !r.did || r.didStatus === 3)
  const scopeIds = form.partsInfoIds || []
  if (scopeIds.length) {
    const set = new Set(scopeIds.map(Number))
    needRows = needRows.filter((r) => set.has(Number(r.partsId)))
  }
  if (!needRows.length) {
    ElMessage.info('当前范围内单件 DID 均已生成，无需重复生成')
    return
  }
  const targetPartsIds = [...new Set(needRows.map((r) => r.partsId).filter(Boolean))]
  let success = 0
  let failed = 0
  for (const partsId of targetPartsIds) {
    try {
      await generateDidSync(partsId)
      success++
    } catch (e) {
      failed++
    }
  }
  ElMessage.success(`批量生成完成：成功${success}，失败${failed}`)
  await fetchBatchOverview(targetBatch)
}

const openBatchPicker = () => {
  batchPickerPage.value = 1
  batchPickerSize.value = 10
  batchPickerVisible.value = true
}

const selectBatch = async (batchNumber) => {
  batchPickerVisible.value = false
  selectedBatch.value = batchNumber
  form.batchNumber = batchNumber
  batchOverviewMeta.partsInfoRows = []
  batchOverviewMeta.partsInfoRowCount = 0
  batchOverviewMeta.plannedQuantitySum = 0
  await onRecordBatchChange(batchNumber)
  await fetchBatchOverview(batchNumber)
}

const onRecordBatchChange = async (batchNumber) => {
  recordParts.value = allParts.value.filter((p) => p.batchNumber === batchNumber)
}

const loadBatchEventVcRows = async () => {
  if (!selectedBatch.value) {
    batchEventVcRows.value = []
    return
  }
  const fromMeta = (batchOverviewMeta.partsInfoRows || []).map((p) => p.id).filter((id) => id != null)
  const batchPartIds =
    fromMeta.length > 0
      ? fromMeta
      : allParts.value.filter((p) => p.batchNumber === selectedBatch.value).map((p) => p.id)
  if (!batchPartIds.length) {
    batchEventVcRows.value = []
    return
  }
  const [eventRes, vcRes] = await Promise.all([
    getEventList({}),
    getCertificateList({})
  ])
  const eventList = eventRes.data?.list || []
  const certList = vcRes.data?.list || []
  const unitCodeMap = new Map((batchItems.value || []).map((item) => [item.unitId, item.unitCode]))
  const certByEvent = new Map()
  certList.forEach((c) => {
    const eventId = c.eventId ?? c.event_id
    if (eventId) certByEvent.set(eventId, c)
  })
  batchEventVcRows.value = eventList
    .filter((e) => batchPartIds.includes(e.partsId ?? e.parts_id))
    .map((e) => {
      const eventId = e.id
      const cert = certByEvent.get(eventId)
      return {
        unitId: e.unitId ?? e.unit_id,
        unitCode: unitCodeMap.get(e.unitId ?? e.unit_id) || '-',
        eventType: e.eventType ?? e.event_type,
        eventName: e.eventName ?? e.event_name,
        eventTime: e.eventTime ?? e.event_time,
        vcId: cert?.vcId || cert?.vc_id || '',
        vcDbId: cert?.id,
        vcTypeText: vcTypeText(cert?.vcType || cert?.vc_type)
      }
    })
}

const handleBoardRowClick = async (row) => {
  boardSelected.value = row
  boardDetailVisible.value = true
  await loadSelectedUnitTraceRows(row)
}

const loadSelectedUnitTraceRows = async (row) => {
  if (!row?.unitId) {
    selectedUnitTraceRows.value = []
    return
  }
  const [eventRes, vcRes] = await Promise.all([
    getEventList({ partsId: row.partsId }),
    getCertificateList({ partsId: row.partsId })
  ])
  const eventList = eventRes.data?.list || []
  const certList = vcRes.data?.list || []
  const certByEvent = new Map()
  certList.forEach((c) => {
    const eventId = c.eventId ?? c.event_id
    if (eventId) certByEvent.set(eventId, c)
  })
  selectedUnitTraceRows.value = eventList
    .filter((e) => (e.unitId ?? e.unit_id) === row.unitId)
    .map((e) => {
      const cert = certByEvent.get(e.id)
      return {
        eventType: e.eventType ?? e.event_type,
        eventName: e.eventName ?? e.event_name,
        eventTime: e.eventTime ?? e.event_time,
        vcDbId: cert?.id,
        vcId: cert?.vcId || cert?.vc_id || '',
        vcTypeText: vcTypeText(cert?.vcType || cert?.vc_type)
      }
    })
    .sort((a, b) => String(a.eventTime || '').localeCompare(String(b.eventTime || '')))
}

const openVcDetail = async (row) => {
  if (!row?.vcDbId) {
    if (row?.vcId) {
      ElMessage.warning('缺少凭证库记录 ID，请到「凭证管理」中查看该 VC')
    }
    return
  }
  vcDetailVisible.value = true
  vcDetailLoading.value = true
  try {
    const res = await getCertificateDetail(row.vcDbId)
    currentVcDetail.value = res.data || null
  } finally {
    vcDetailLoading.value = false
  }
}

const submitRecord = async (mode) => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (showPartsInfoPicker.value && !(form.partsInfoIds || []).length) {
      ElMessage.warning('请至少勾选一条主数据')
      return
    }
    if (eligibleCount.value <= 0) {
      ElMessage.warning('当前批次没有可处理单件，请切换事件类型或检查前序流程')
      return
    }
    submitting.value = true
    statusEvent.value = '执行中...'
    statusVc.value = '待执行'
    statusChain.value = '待执行'
    try {
      const payload = {
        batchNumber: form.batchNumber,
        actionType: form.eventType,
        eventName: form.eventName,
        operatorId: form.operatorId,
        operatorName: form.operatorName,
        organization: form.organization,
        eventLocation: form.eventLocation,
        eventTime: form.eventTime,
        evidenceUrls: form.evidenceUrls,
        issueVc: mode === 'vc' || form.issueVc,
        productionLine: form.productionLine,
        productionBatch: form.productionBatch,
        inspectionType: form.inspectionType,
        inspectionResult: form.inspectionResult,
        logisticsType: form.logisticsType,
        trackingNumber: form.trackingNumber,
        ...(form.partsInfoIds?.length ? { partsIds: form.partsInfoIds.map(Number) } : {})
      }
      lastPayload.value = payload
      const res = await submitWorkbenchBatchAction(payload)
      statusEvent.value = '已完成'
      statusVc.value = payload.issueVc ? '已完成' : '已跳过'
      statusChain.value = '已完成'
      const data = res.data || {}
      ElMessage.success(`批次处理完成：成功${data.success || 0}，失败${data.failed || 0}`)
      lastResult.success = data.success || 0
      lastResult.failed = data.failed || 0
      lastResult.failures = data.failures || []
      resultDrawerVisible.value = true
      await fetchTasks()
      await fetchBatchOverview(form.batchNumber)
    } catch (e) {
      statusEvent.value = '失败'
      statusVc.value = '失败'
      statusChain.value = '失败'
      throw e
    } finally {
      submitting.value = false
    }
  })
}

const retryFailed = async () => {
  if (!lastPayload.value || !lastResult.failed) return
  const res = await submitWorkbenchBatchAction(lastPayload.value)
  const data = res.data || {}
  lastResult.success = data.success || 0
  lastResult.failed = data.failed || 0
  lastResult.failures = data.failures || []
  ElMessage.success(`重试完成：成功${data.success || 0}，失败${data.failed || 0}`)
  await fetchBatchOverview(form.batchNumber)
}

watch(activeTab, (name) => {
  if (name === 'followup' && selectedBatch.value) {
    fetchBatchOverview(selectedBatch.value)
  }
})

onMounted(async () => {
  if (store.state.user.token && !store.state.user.userInfo) {
    try {
      await store.dispatch('user/getUserInfo')
    } catch {
      /* 未登录或接口失败时保持表单默认值 */
    }
  }
  await fetchParts()
  await fetchTasks()
  await onRecordBatchChange(form.batchNumber)
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header h2 { margin: 0; font-size: 22px; }
.page-header p { margin: 6px 0 0; color: #64748b; }
.record-layout {
  display: grid;
  grid-template-columns: minmax(0, 8fr) minmax(0, 2fr);
  gap: 14px;
  align-items: start;
}
.batch-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
.record-main {
  background: #fff;
  padding: 16px 20px 20px 24px;
  border-radius: 8px;
  box-sizing: border-box;
}
/* 标签左对齐（与 Element Plus 默认右侧标签区分） */
.record-main-form :deep(.el-form-item__label) {
  justify-content: flex-start;
}
.batch-status-card { margin-bottom: 12px; }
.batch-status-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
.status-tip { color: #64748b; font-size: 12px; }
.batch-meta-hint { margin-top: 6px; font-size: 12px; color: #64748b; }
.submit-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.submit-hint { margin: 8px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.45; max-width: 520px; }
.did-hint-tight { margin: 0 0 8px; }
.preview-alert { margin-bottom: 10px; }
.event-vc-card { margin-top: 12px; }
.board-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.vc-json-title { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.record-side { display: flex; flex-direction: column; gap: 12px; }
.result-head { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
.kv { display: flex; align-items: center; justify-content: space-between; margin: 6px 0; font-size: 13px; }
.did-section-title { font-size: 12px; color: #64748b; margin-bottom: 6px; }
.parts-select-hint { font-size: 12px; color: #94a3b8; margin: 6px 0 0; line-height: 1.45; }
.side-hint { font-size: 12px; color: #94a3b8; margin: 8px 0 0; line-height: 1.5; }
.did-actions { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
.batch-picker-inline { display: grid; grid-template-columns: 1fr auto; gap: 8px; width: 100%; }
.picker-pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
.ctx-alert { margin-top: 10px; }
.hint { color: #64748b; margin-bottom: 10px; }
.doc { margin: 0; padding: 12px; border-radius: 6px; background: #0f172a; color: #e2e8f0; max-height: 460px; overflow: auto; font-size: 12px; }
.followup-tab { min-height: 280px; }
.followup-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 14px; }
.followup-head-text { font-size: 13px; color: #64748b; line-height: 1.5; }
.followup-card { margin-bottom: 12px; }
.followup-note { margin: 10px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.45; }
.followup-ext-intro { margin: 0 0 12px; font-size: 13px; color: #64748b; line-height: 1.5; }
.followup-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.operator-time-row :deep(.el-form-item) { margin-bottom: 12px; }
.operator-fill-hint { margin: -2px 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.4; padding-left: 110px; }
</style>
