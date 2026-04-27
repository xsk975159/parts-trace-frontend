<template>
  <div class="stats-container">
    <div class="page-header">
      <h2>数据统计</h2>
      <div class="header-right">
        <el-tag type="success" effect="dark">实时数据</el-tag>
        <el-button size="small" :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card" v-for="(kpi,i) in kpis" :key="kpi.title" :style="{animationDelay:i*0.08+'s'}">
        <div class="kpi-header"><span class="kpi-title">{{kpi.title}}</span><div class="kpi-icon" :style="{color:kpi.color}"><el-icon :size="20"><component :is="kpi.icon"/></el-icon></div></div>
        <div class="kpi-value" :style="{color:kpi.color}">{{kpi.value}}</div>
        <div class="kpi-sub">{{kpi.sub}}</div>
        <div class="kpi-bar"><div class="kpi-bar-fill" :style="{width:kpi.pct+'%',background:kpi.color}"></div></div>
      </div>
    </div>
    <div class="mid-grid">
      <div class="chart-card">
        <div class="card-header"><h3>溯源事件类型分布</h3></div>
        <div class="donut-chart">
          <div class="donut-ring">
            <svg viewBox="0 0 120 120" class="donut-svg">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" stroke-width="18"/>
              <circle v-for="(seg,i) in donutSegments" :key="i" cx="60" cy="60" r="45" fill="none" :stroke="seg.color" stroke-width="16" :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset" style="transform:rotate(-90deg);transform-origin:60px 60px;"/>
            </svg>
            <div class="donut-center"><div class="donut-total">{{totalEvents}}</div><div class="donut-label">事件总数</div></div>
          </div>
          <div class="donut-legend">
            <div class="legend-item" v-for="item in eventDist" :key="item.label">
              <span class="legend-dot" :style="{background:item.color}"></span>
              <span class="legend-label">{{item.label}}</span>
              <span class="legend-val">{{item.count}}</span>
              <span class="legend-pct" :style="{color:item.color}">{{item.pct}}%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <div class="card-header"><h3>零部件分类统计</h3></div>
        <div class="bar-chart">
          <div class="bar-item" v-for="cat in categoryStats" :key="cat.name">
            <div class="bar-label">{{cat.name}}</div>
            <div class="bar-track"><div class="bar-fill" :style="{width:cat.pct+'%',background:cat.color}"></div></div>
            <div class="bar-val">{{cat.count}}</div>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <div class="card-header"><h3>预警处理情况</h3></div>
        <div class="alert-stats">
          <div class="alert-stat-ring">
            <svg viewBox="0 0 100 100" class="ring-svg">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" stroke-width="14"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#48bb78" stroke-width="14" :stroke-dasharray="handlePct*2.39+' 239'" stroke-dashoffset="60" style="transform:rotate(-90deg);transform-origin:50px 50px;" stroke-linecap="round"/>
            </svg>
            <div class="ring-center"><div class="ring-pct">{{handlePct}}%</div><div class="ring-sub">处理率</div></div>
          </div>
          <div class="alert-stat-detail">
            <div class="ast-item"><span class="ast-dot" style="background:#f56565"></span><span class="ast-label">严重预警</span><span class="ast-val">{{alertStats.error}}</span></div>
            <div class="ast-item"><span class="ast-dot" style="background:#ed8936"></span><span class="ast-label">警告预警</span><span class="ast-val">{{alertStats.warning}}</span></div>
            <div class="ast-item"><span class="ast-dot" style="background:#48bb78"></span><span class="ast-label">已处理</span><span class="ast-val">{{alertStats.handled}}</span></div>
            <div class="ast-item"><span class="ast-dot" style="background:#64748b"></span><span class="ast-label">未处理</span><span class="ast-val">{{alertStats.unhandled}}</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="chart-card">
      <div class="card-header">
        <h3>近7日溯源事件趋势</h3>
        <div class="legend-row">
          <span class="legend-dot" style="background:#667eea"></span><span>生产</span>
          <span class="legend-dot" style="background:#48bb78"></span><span>质检</span>
          <span class="legend-dot" style="background:#ed8936"></span><span>物流</span>
          <span class="legend-dot" style="background:#38b2ac"></span><span>交付</span>
        </div>
      </div>
      <div class="trend-chart">
        <div class="trend-item" v-for="day in trendData" :key="day.date">
          <div class="trend-bars">
            <div class="trend-bar production" :style="{height:day.production*4+'px'}"></div>
            <div class="trend-bar quality" :style="{height:day.quality*4+'px'}"></div>
            <div class="trend-bar logistics" :style="{height:day.logistics*4+'px'}"></div>
            <div class="trend-bar delivery" :style="{height:day.delivery*4+'px'}"></div>
          </div>
          <div class="trend-date">{{day.date}}</div>
        </div>
      </div>
    </div>
    <div class="chart-card">
      <div class="card-header">
        <h3>最新入库零部件</h3>
        <el-button size="small" link type="primary" @click="$router.push('/parts/list')">查看全部</el-button>
      </div>
      <el-table :data="latestParts" class="stats-table">
        <el-table-column prop="partsCode" label="编码" width="140"/>
        <el-table-column prop="partsName" label="名称" min-width="150"/>
        <el-table-column prop="batchNumber" label="批次号" width="130"/>
        <el-table-column prop="manufacturer" label="生产厂商" width="130"/>
        <el-table-column prop="quantity" label="数量" width="80"/>
        <el-table-column prop="productionDate" label="生产日期" width="120"/>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{row}"><el-tag :type="row.status===1?'success':'info'" size="small">{{row.status===1?'正常':'草稿'}}</el-tag></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'
import { getDashboardStats } from '@/api/dashboard'
import { getEventList } from '@/api/trace'
import { getAlertList } from '@/api/anomaly'
import { getPartsList } from '@/api/parts'

const statsData = ref({})
const latestParts = ref([])
const allAlerts = ref([])
const allEvents = ref([])
const trendData = ref([])

const totalEvents = computed(() => allEvents.value.length)

const kpis = computed(() => [
  { title: '零部件总数', value: statsData.value.totalParts||0, sub: '已入库登记', icon: 'Box', color: '#667eea', pct: 80 },
  { title: '区块链事件', value: statsData.value.totalEvents||0, sub: '链上存证记录', icon: 'Connection', color: '#f5576c', pct: 65 },
  { title: '数字凭证', value: statsData.value.totalCertificates||0, sub: '已颁发凭证', icon: 'Tickets', color: '#4facfe', pct: 72 },
  { title: '质检通过率', value: (statsData.value.qualityPassRate||0)+'%', sub: '本月质检结果', icon: 'CircleCheck', color: '#43e97b', pct: statsData.value.qualityPassRate||0 },
  { title: '今日事件', value: statsData.value.todayEvents||0, sub: '今日新增上链', icon: 'Calendar', color: '#fa709a', pct: 45 },
  { title: '待处理预警', value: statsData.value.unhandledAlerts||0, sub: '需要及时处理', icon: 'Warning', color: '#ed8936', pct: 30 }
])

const eventDist = computed(() => {
  const total = allEvents.value.length || 1
  return [
    { label: '生产事件', key: 'production', color: '#667eea' },
    { label: '质检事件', key: 'quality', color: '#48bb78' },
    { label: '物流事件', key: 'logistics', color: '#ed8936' },
    { label: '交付事件', key: 'delivery', color: '#38b2ac' }
  ].map(t => { const count = allEvents.value.filter(e => e.eventType===t.key).length; return {...t, count, pct: Math.round(count/total*100)} })
})

const circumference = 2 * Math.PI * 45
const donutSegments = computed(() => {
  const total = eventDist.value.reduce((s,d)=>s+d.count,0)||1
  let acc = 0
  return eventDist.value.map(d => {
    const arcLen = (d.count/total)*circumference
    const seg = { color: d.color, dash: `${arcLen} ${circumference-arcLen}`, offset: -(acc/total*circumference) }
    acc += d.count; return seg
  })
})

const categoryStats = computed(() =>
  mockData.categories.filter(c => c.parentId===0).map((c,i) => ({
    name: c.categoryName, count: [8,5][i]||3, pct: [85,50][i]||30,
    color: ['#667eea','#48bb78','#ed8936','#f5576c'][i%4]
  }))
)

const alertStats = computed(() => ({
  error: allAlerts.value.filter(a=>a.alertLevel==='error').length,
  warning: allAlerts.value.filter(a=>a.alertLevel==='warning').length,
  handled: allAlerts.value.filter(a=>a.status===1).length,
  unhandled: allAlerts.value.filter(a=>a.status===0).length
}))

const handlePct = computed(() => {
  const total = allAlerts.value.length
  return total ? Math.round(allAlerts.value.filter(a=>a.status===1).length/total*100) : 0
})

const genTrend = () => {
  trendData.value = Array.from({length:7},(_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i))
    return { date:`${d.getMonth()+1}/${d.getDate()}`, production:Math.floor(Math.random()*15)+5,
      quality:Math.floor(Math.random()*12)+3, logistics:Math.floor(Math.random()*10)+2, delivery:Math.floor(Math.random()*8)+1 }
  })
}

const loadData = async () => {
  try {
    const s = await getDashboardStats()
    if (s?.data) statsData.value = s.data
  } catch {
    statsData.value = {}
  }
  try {
    const e = await getEventList({ page: 1, pageSize: 500 })
    allEvents.value = e?.data?.list || []
  } catch {
    allEvents.value = []
  }
  try {
    const a = await getAlertList({})
    allAlerts.value = a?.data?.list || []
  } catch {
    allAlerts.value = []
  }
  try {
    const p = await getPartsList({ page: 1, pageSize: 20 })
    const pageData = p?.data || {}
    latestParts.value = pageData.records || pageData.list || []
  } catch {
    latestParts.value = []
  }
  genTrend()
}

onMounted(loadData)
</script>

<style scoped>
.stats-container { display:flex; flex-direction:column; gap:20px; }
.page-header { display:flex; justify-content:space-between; align-items:center; }
.page-header h2 { font-size:22px; font-weight:700; color:#1e293b; margin:0; }
.header-right { display:flex; align-items:center; gap:10px; }
.kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
.kpi-card { background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e2e8f0; animation:fadeIn 0.5s ease-out both; transition:all .3s; }
.kpi-card:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(0,0,0,.3); }
.kpi-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.kpi-title { font-size:12px; color:#475569; }
.kpi-value { font-size:30px; font-weight:700; margin-bottom:4px; }
.kpi-sub { font-size:12px; color:#94a3b8; margin-bottom:12px; }
.kpi-bar { height:4px; background:#f1f5f9; border-radius:2px; overflow:hidden; }
.kpi-bar-fill { height:100%; border-radius:2px; transition:width 1.2s ease; }
.mid-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; }
.chart-card { background:#ffffff; border-radius:16px; padding:22px; border:1px solid #e2e8f0; }
.card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid #e2e8f0; }
.card-header h3 { font-size:15px; font-weight:600; color:#1e293b; margin:0; }
.legend-row { display:flex; align-items:center; gap:10px; font-size:12px; color:#475569; }
.donut-chart { display:flex; align-items:center; gap:24px; }
.donut-ring { position:relative; width:130px; height:130px; flex-shrink:0; }
.donut-svg { width:100%; height:100%; }
.donut-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.donut-total { font-size:20px; font-weight:700; color:#1e293b; }
.donut-label { font-size:11px; color:#94a3b8; }
.donut-legend { display:flex; flex-direction:column; gap:10px; flex:1; }
.legend-item { display:flex; align-items:center; gap:8px; font-size:13px; }
.legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; display:inline-block; }
.legend-label { flex:1; color:#475569; }
.legend-val { font-weight:600; color:#1e293b; }
.legend-pct { font-size:12px; font-weight:600; }
.bar-chart { display:flex; flex-direction:column; gap:14px; }
.bar-item { display:flex; align-items:center; gap:10px; }
.bar-label { font-size:13px; color:#475569; width:70px; flex-shrink:0; }
.bar-track { flex:1; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
.bar-fill { height:100%; border-radius:4px; transition:width 1s ease; }
.bar-val { font-size:13px; font-weight:600; color:#1e293b; width:24px; text-align:right; }
.alert-stats { display:flex; align-items:center; gap:24px; }
.alert-stat-ring { position:relative; width:120px; height:120px; flex-shrink:0; }
.ring-svg { width:100%; height:100%; }
.ring-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.ring-pct { font-size:20px; font-weight:700; color:#48bb78; }
.ring-sub { font-size:11px; color:#94a3b8; }
.alert-stat-detail { display:flex; flex-direction:column; gap:12px; flex:1; }
.ast-item { display:flex; align-items:center; gap:10px; font-size:13px; }
.ast-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.ast-label { flex:1; color:#475569; }
.ast-val { font-weight:700; color:#1e293b; }
.trend-chart { display:flex; align-items:flex-end; gap:16px; padding:10px 0; min-height:120px; }
.trend-item { display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
.trend-bars { display:flex; align-items:flex-end; gap:3px; }
.trend-bar { width:10px; border-radius:3px 3px 0 0; min-height:4px; transition:height 0.8s ease; }
.trend-bar.production { background:#667eea; }
.trend-bar.quality { background:#48bb78; }
.trend-bar.logistics { background:#ed8936; }
.trend-bar.delivery { background:#38b2ac; }
.trend-date { font-size:11px; color:#94a3b8; }
</style>

