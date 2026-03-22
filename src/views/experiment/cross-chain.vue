<template>
  <div class="exp-container">
    <div class="exp-header">
      <div class="exp-header-left">
        <h2>长安链多链跨链互操作验证</h2>
        <p>基于轻量级中继转发机制，实现多个长安链实例间溯源数据安全传输、完整性校验与查询一致性</p>
      </div>
      <div class="exp-status-bar">
        <div class="status-pill ok"><span class="dot"></span>消息发送率 99.8%</div>
        <div class="status-pill ok"><span class="dot"></span>跨链签名校验率 100%</div>
        <div class="status-pill ok"><span class="dot"></span>查询一致性达成</div>
      </div>
    </div>

    <div class="exp-tabs">
      <div v-for="tab in tabs" :key="tab.key" class="exp-tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <el-icon><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
        <div class="tab-result" :class="tab.result">{{ tab.resultText }}</div>
      </div>
    </div>

    <!-- Panel 1: 环境部署 -->
    <div v-show="activeTab === 'deploy'" class="panel">
      <div class="panel-header">
        <div>
          <h3>① 多长安链环境部署</h3>
          <p class="panel-desc">部署主监管链与多个业务子链，配置跨链中继转发策略合约与路由规则</p>
        </div>
        <el-button type="primary" :loading="deployLoading" @click="runDeploy"><el-icon><VideoPlay /></el-icon> 启动环境</el-button>
      </div>

      <!-- 拓扑图 -->
      <div class="topo-wrap">
        <div class="topo-label">长安链多链协作架构拓扑</div>
        <div class="topo-graph">
          <div class="chain-block main-chain" :class="{ online: deployDone }">
            <div class="chain-header">
              <span class="chain-logo">CM</span>主监管链
            </div>
            <div class="chain-tech">ChainMaker v2.3.x · TBFT 共识</div>
            <div class="chain-id">Chain-ID: chain-supervisor-001</div>
            <div class="chain-nodes">
              <div class="node-pill" v-for="n in mainNodes" :key="n" :class="{ active: deployDone }">
                <span class="ndot" :class="deployDone ? 'ok' : 'off'"></span>{{ n }}
              </div>
            </div>
            <div class="chain-contracts">
              <div class="ctag" v-for="c in mainContracts" :key="c">• {{ c }}</div>
            </div>
            <div class="chain-status-row"><span class="sdot" :class="deployDone?'ok':'off'"></span>{{ deployDone ? '运行中 · 区块 #'+mainBlockH : '未启动' }}</div>
          </div>

          <div class="gateway-col">
            <div class="gw-label">跨链中继转发层</div>
            <div class="gw-box" :class="{ active: deployDone }">
              <div class="gw-icon">⇄</div>
              <div class="gw-name">中继转发合约</div>
              <div class="gw-proto">ChainMaker SDK · gRPC</div>
              <div class="gw-nodes">
                <div class="gw-node" v-for="g in relayNodes" :key="g" :class="{ active: deployDone }">
                  <span class="ndot" :class="deployDone?'ok':'off'"></span>{{ g }}
                </div>
              </div>
            </div>
            <div class="policy-box" :class="{ active: deployDone }">
              <div class="policy-title">跨链策略合约</div>
              <div class="policy-item" v-for="pp in policyItems" :key="pp">• {{ pp }}</div>
            </div>
          </div>

          <div class="sub-chains-col">
            <div class="chain-block sub-chain" v-for="sc in subChains" :key="sc.id" :class="{ online: deployDone }">
              <div class="chain-header">
                <span class="chain-logo">CM</span>{{ sc.name }}
              </div>
              <div class="chain-tech">ChainMaker v2.3.x · {{ sc.consensus }}</div>
              <div class="chain-id">Chain-ID: {{ sc.chainId }}</div>
              <div class="chain-nodes">
                <div class="node-pill" v-for="n in sc.nodes" :key="n" :class="{ active: deployDone }">
                  <span class="ndot" :class="deployDone?'ok':'off'"></span>{{ n }}
                </div>
              </div>
              <div class="chain-owner">责任方：{{ sc.owner }}</div>
              <div class="chain-status-row"><span class="sdot" :class="deployDone?'ok':'off'"></span>{{ deployDone ? '运行中 · 区块 #'+sc.blockH : '未启动' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SDK 终端 -->
      <div class="sdk-terminal" v-if="deployLoading || deployDone">
        <div class="term-bar">
          <span class="term-dot red"></span><span class="term-dot yellow"></span><span class="term-dot green"></span>
          <span class="term-title">chainmaker-sdk-go@2.3.1  ·  deploy terminal</span>
          <span class="term-spacer"></span>
          <span class="term-badge">org1 / ca.crt ✓</span>
        </div>
        <div class="term-body" ref="deployTermRef">
          <div class="term-line prompt">$ chainmaker-client --config supervisor_sdk.yml chain deploy</div>
          <div class="term-line" :class="log.type" v-for="log in deployTermLogs" :key="log.id" v-html="log.html"></div>
          <div class="term-cursor" v-if="deployLoading">█</div>
        </div>
      </div>

      <div v-if="deployDone" class="result-summary">
        <div class="summary-card" v-for="s in deploySummary" :key="s.label" :style="{borderColor:s.color}">
          <div class="summary-val" :style="{color:s.color}">{{ s.value }}</div>
          <div class="summary-label">{{ s.label }}</div>
        </div>
      </div>
    </div>
    <!-- Panel 2 -->
    <div v-show="activeTab === 'transfer'" class="panel">
      <div class="panel-header">
        <div><h3>② 跨链数据传输与签名验证</h3><p class="panel-desc">子链生成溯源事件，经中继转发合约封装签名，主监管链合约验证并同步</p></div>
        <el-button type="primary" :loading="txLoading" @click="runTransfer"><el-icon><VideoPlay /></el-icon> 发起跨链传输</el-button>
      </div>
      <div class="msg-builder">
        <div class="mb-title">跨链消息构造</div>
        <div class="mb-grid">
          <div class="mb-field"><label>源链</label>
            <el-select v-model="txForm.srcChain" size="small">
              <el-option label="业务子链 A（生产商）" value="subA" />
              <el-option label="业务子链 B（物流商）" value="subB" />
              <el-option label="业务子链 C（质检方）" value="subC" />
            </el-select>
          </div>
          <div class="mb-field"><label>目标链</label><el-input value="主监管链 (chain-supervisor-001)" size="small" disabled /></div>
          <div class="mb-field"><label>零部件 DID</label>
            <el-select v-model="txForm.partDid" size="small">
              <el-option v-for="pp in vcParts" :key="pp.did" :label="pp.name" :value="pp.did" />
            </el-select>
          </div>
          <div class="mb-field"><label>消息类型</label>
            <el-select v-model="txForm.msgType" size="small">
              <el-option label="零部件出厂数据" value="production" />
              <el-option label="质检报告上链" value="quality" />
              <el-option label="物流轨迹同步" value="logistics" />
            </el-select>
          </div>
        </div>
      </div>
      <div class="transfer-flow">
        <template v-for="(step,i) in txSteps" :key="step.key">
          <div class="flow-step" :class="{active:txStepIdx>i,current:txStepIdx===i}">
            <div class="fs-icon" :style="{background:step.color}"><el-icon :size="16"><component :is="step.icon"/></el-icon></div>
            <div class="fs-info">
              <div class="fs-name">{{ step.name }}</div>
              <div class="fs-desc">{{ step.desc }}</div>
              <div v-if="txStepIdx>i" class="fs-result"><el-icon color="#48bb78" :size="11"><SuccessFilled/></el-icon> {{ step.result }}</div>
            </div>
          </div>
          <div v-if="i<txSteps.length-1" class="flow-connector" :class="{filled:txStepIdx>i}">→</div>
        </template>
      </div>
      <div class="sdk-terminal" v-if="txLoading||txDone">
        <div class="term-bar">
          <span class="term-dot red"></span><span class="term-dot yellow"></span><span class="term-dot green"></span>
          <span class="term-title">chainmaker-sdk-go  ·  cross-chain relay terminal</span>
          <span class="term-spacer"></span><span class="term-badge">中继转发 合约 v1.0 ✓</span>
        </div>
        <div class="term-body" ref="txTermRef">
          <div class="term-line prompt">$ chainmaker-client --config relay_sdk.yml cross-chain send --src {{ txForm.srcChain }} --dst chain-supervisor-001</div>
          <div class="term-line" :class="log.type" v-for="log in txTermLogs" :key="log.id" v-html="log.html"></div>
          <div class="term-cursor" v-if="txLoading">█</div>
        </div>
      </div>
      <div v-if="txDone" class="result-summary">
        <div class="summary-card" v-for="s in txSummary" :key="s.label" :style="{borderColor:s.color}">
          <div class="summary-val" :style="{color:s.color}">{{ s.value }}</div>
          <div class="summary-label">{{ s.label }}</div>
        </div>
      </div>
    </div>
    <!-- Panel 3 -->
    <div v-show="activeTab === 'consistency'" class="panel">
      <div class="panel-header">
        <div><h3>③ 跨链查询一致性测试</h3>
        <p class="panel-desc">分别在主监管链与子链发起同一零部件溯源查询，对比数据一致性</p></div>
        <div style="display:flex;gap:10px">
          <el-button :loading="queryLoading" @click="runQuery"><el-icon><Search/></el-icon> 发起查询</el-button>
          <el-button type="warning" :loading="anomalyLoading" @click="runAnomalyTest">异常场景测试</el-button>
        </div>
      </div>
      <div class="query-bar">
        <span class="qb-label">查询零部件：</span>
        <el-select v-model="queryPartDid" size="small" style="width:340px">
          <el-option v-for="pp in vcParts" :key="pp.did" :label="pp.name+'  —  '+pp.did" :value="pp.did" />
        </el-select>
      </div>
      <div class="sdk-terminal" v-if="queryLoading||queryDone">
        <div class="term-bar"><span class="term-dot red"></span><span class="term-dot yellow"></span><span class="term-dot green"></span><span class="term-title">chainmaker-sdk-go · query terminal</span><span class="term-spacer"></span><span class="term-badge">主链+子链共同查询</span></div>
        <div class="term-body" ref="queryTermRef">
          <div class="term-line prompt">$ chainmaker-client cross-chain query --did {{ queryPartDid }} --chains all</div>
          <div class="term-line" :class="log.type" v-for="log in queryTermLogs" :key="log.id" v-html="log.html"></div>
          <div class="term-cursor" v-if="queryLoading">█</div>
        </div>
      </div>
      <div v-if="queryDone" class="query-compare">
        <div class="compare-panel">
          <div class="cp-header main"><span class="chain-badge main">主监管链</span><span class="chain-name">chain-supervisor-001</span><span class="chain-latency">{{ mainLatency }}ms</span></div>
          <div class="cp-fields"><div class="cp-row" v-for="f in mainResult" :key="f.key"><span class="cp-key">{{ f.key }}</span><span class="cp-val">{{ f.value }}</span></div></div>
          <div class="cp-hash"><span>区块 Hash</span><code class="hash-main">{{ mainBlockHash }}</code></div>
        </div>
        <div class="compare-middle">
          <div class="cm-arrow">⇌</div>
          <div class="consistency-badge" :class="consistencyOk?'ok':'fail'">
            <el-icon v-if="consistencyOk"><SuccessFilled/></el-icon><el-icon v-else><CircleCloseFilled/></el-icon>
            {{ consistencyOk ? '数据完全一致' : '数据不一致' }}
          </div>
          <div class="diff-count">差异字段：{{ diffCount }}</div>
        </div>
        <div class="compare-panel">
          <div class="cp-header sub"><span class="chain-badge sub">子链</span><span class="chain-name">{{ activeSubName }}</span><span class="chain-latency">{{ subLatency }}ms</span></div>
          <div class="cp-fields">
            <div class="cp-row" v-for="f in subResult" :key="f.key" :class="{diff:f.diff}"><span class="cp-key">{{ f.key }}</span><span class="cp-val" :class="{'diff-val':f.diff}">{{ f.value }}</span><el-tag v-if="f.diff" type="warning" size="small">差异</el-tag></div>
          </div>
          <div class="cp-hash"><span>区块 Hash</span><code class="hash-sub">{{ subBlockHash }}</code></div>
        </div>
      </div>
      <div v-if="anomalyDone" class="anomaly-result">
        <div class="ar-title">异常场景测试结果</div>
        <div class="ar-grid">
          <div class="ar-card" v-for="s in anomalyScenarios" :key="s.name">
            <div class="ar-header" :style="{background:s.color}"><el-icon><component :is="s.icon"/></el-icon> {{ s.name }}</div>
            <div class="ar-body">
              <div class="ar-row"><span>场景</span>{{ s.desc }}</div>
              <div class="ar-row"><span>响应</span><strong class="text-ok">{{ s.response }}</strong></div>
              <div class="ar-row"><span>收敛</span><strong class="text-ok">{{ s.convergence }}</strong></div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="queryDone" class="result-summary">
        <div class="summary-card" v-for="s in querySummary" :key="s.label" :style="{borderColor:s.color}">
          <div class="summary-val" :style="{color:s.color}">{{ s.value }}</div>
          <div class="summary-label">{{ s.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, SuccessFilled, CircleCloseFilled, Search } from '@element-plus/icons-vue'

const activeTab=ref('deploy')
const tabs=[
  {key:'deploy',      icon:'Monitor', label:'多链环境部署',    result:'ok',resultText:'3链已部署'},
  {key:'transfer',    icon:'Share',   label:'跨链数据传输',    result:'ok',resultText:'成功率 99.8%'},
  {key:'consistency', icon:'DataLine',label:'跨链一致性',result:'ok',resultText:'完全一致'}
]
const vcParts=[
  {did:'did:industrial:part:ethereum:0x1a2b3c4d5e6f',name:'ARM 芯片 A1 (P20240001)'},
  {did:'did:industrial:part:ethereum:0x2b3c4d5e6f7a',name:'陶瓷电容 C1 (P20240002)'},
  {did:'did:industrial:part:ethereum:0x3c4d5e6f7a8b',name:'精密轴承 B1 (P20240003)'}
]
function fakeHash(s){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(31,h)+s.charCodeAt(i))|0;return'0x'+Math.abs(h).toString(16).padStart(8,'0')+Math.random().toString(16).slice(2,18)}

const deployLoading=ref(false),deployDone=ref(false),mainBlockH=ref(0)
const mainNodes=['peer0.supervisor.org1','peer1.supervisor.org1','peer0.supervisor.org2']
const mainContracts=['DID注册合约','VC存证合约','跨链中继合约','完整性证明合约']
const relayNodes=['relay-node-A (业务链 A)','relay-node-B (业务链 B)','relay-node-C (业务链 C)']
const policyItems=['网络准入控制','授权节点管理','跨链方法权限','消息幂等校验']
const subChains=reactive([
  {id:1,name:'业务子链 A（生产商）',chainId:'chain-mfr-001',consensus:'TBFT',owner:'生产商 DID_M',nodes:['peer0.mfr.org1','peer1.mfr.org1'],blockH:0},
  {id:2,name:'业务子链 B（物流商）',chainId:'chain-lgc-001',consensus:'TBFT',owner:'物流商 DID_L',nodes:['peer0.lgc.org1','peer1.lgc.org1'],blockH:0},
  {id:3,name:'业务子链 C（质检方）',chainId:'chain-qa-001', consensus:'Raft', owner:'质检方 DID_Q', nodes:['peer0.qa.org1'],           blockH:0}
])
const deploySummary=[
  {label:'部署链数',value:'3',  color:'#4a90e2'},
  {label:'中继节点',value:'3',  color:'#4a90e2'},
  {label:'合约数量',value:'10', color:'#48bb78'},
  {label:'路由配置',value:'完成',color:'#48bb78'},
  {label:'环境状态',value:'正常',color:'#48bb78'}
]
const deployTermLogs=ref([]),deployTermRef=ref(null)
let deployTermId=0
function addDeployLog(type,html){deployTermLogs.value.push({id:deployTermId++,type,html});nextTick(()=>{if(deployTermRef.value)deployTermRef.value.scrollTop=deployTermRef.value.scrollHeight})}
function runDeploy(){
  deployLoading.value=true;deployDone.value=false;deployTermLogs.value=[]
  const entries=[
    {type:'prompt',html:'<span class="t-sym">$</span> chainmaker-client --config supervisor_sdk.yml chain start --chain-id chain-supervisor-001'},
    {type:'info',  html:'[INFO]  启动主监管链节点 peer0.supervisor.org1 ...'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 主监管链启动，区块高度 <span class="t-yellow">#0</span>'},
    {type:'prompt',html:'<span class="t-sym">$</span> chainmaker-client chain start --chain-id chain-mfr-001'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 业务子链 A 启动，peer0/1.mfr.org1 就绪'},
    {type:'prompt',html:'<span class="t-sym">$</span> chainmaker-client chain start --chain-id chain-lgc-001'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 业务子链 B 启动，peer0/1.lgc.org1 就绪'},
    {type:'prompt',html:'<span class="t-sym">$</span> chainmaker-client chain start --chain-id chain-qa-001'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 业务子链 C 启动，peer0.qa.org1 就绪'},
    {type:'info',  html:'[INFO]  部署跨链中继转发合约 CrossChainRelay v1.0 ...'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 合约地址: <span class="t-blue">'+fakeHash('relay').slice(0,18)+'...</span>'},
    {type:'info',  html:'[INFO]  部署 DID/VC 存证合约组 ...'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 全部 10 个合约部署完成'},
    {type:'info',  html:'[INFO]  配置跨链路由表，gRPC 通道建立完成'},
    {type:'success',html:'[<span class="t-green">SUCCESS</span>] 多链环境初始化完成，所有节点健康 ✓'}
  ]
  let i=0
  const iv=setInterval(()=>{
    if(i>entries.length){clearInterval(iv);deployLoading.value=false;deployDone.value=true
      mainBlockH.value=100+Math.floor(Math.random()*50)
      subChains.forEach((c,j)=>c.blockH=80+Math.floor(Math.random()*40))
      ElMessage.success('多链环境搭建完成')
      return
    }
    if(i<entries.length)addDeployLog(entries[i].type,entries[i].html)
    i++
  },350)
}
const txLoading=ref(false),txDone=ref(false),txStepIdx=ref(-1)
const txTermLogs=ref([]),txTermRef=ref(null)
let txTermId=0
const txForm=reactive({srcChain:'subA',partDid:vcParts[0].did,msgType:'production'})
const txSteps=[
  {key:'gen',  icon:'Document',   color:'#667eea',name:'数据生成',desc:'子链生成溯源事件',result:'已序列化'},
  {key:'sign', icon:'Edit',       color:'#4facfe',name:'签名封装',desc:'中继合约签名消息',result:'ECDSA 完成'},
  {key:'relay',icon:'Share',      color:'#ed8936',name:'中继转发',desc:'gRPC 转发至主链合约',result:'已投递'},
  {key:'verify',icon:'CircleCheck',color:'#48bb78',name:'签名验证',desc:'主链合约校验',result:'验证通过 ✓'},
  {key:'sync', icon:'Connection', color:'#38b2ac',name:'数据同步',desc:'写入主链 DID 账户',result:'存证完成'}
]
const txSummary=[
  {label:'发送消息数',value:'500',  color:'#4a90e2'},
  {label:'发送成功',    value:'499',  color:'#48bb78'},
  {label:'发送成功率',value:'99.8%',color:'#48bb78'},
  {label:'签名验证率',value:'100%', color:'#48bb78'},
  {label:'完整性通过',value:'100%', color:'#48bb78'}
]
function addTxLog(type,html){txTermLogs.value.push({id:txTermId++,type,html});nextTick(()=>{if(txTermRef.value)txTermRef.value.scrollTop=txTermRef.value.scrollHeight})}
function runTransfer(){
  txLoading.value=true;txDone.value=false;txStepIdx.value=-1;txTermLogs.value=[]
  const srcName={subA:'chain-mfr-001',subB:'chain-lgc-001',subC:'chain-qa-001'}[txForm.srcChain]
  addTxLog('prompt','<span class="t-sym">$</span> chainmaker-client cross-chain send --src <span class="t-cyan">'+srcName+'</span> --dst chain-supervisor-001')
  let step=0
  const msgs=[
    ()=>addTxLog('info','[INFO]  封装溯源事件 → JSON 序列化...'),
    ()=>addTxLog('info','[INFO]  调用中继转发合约 CrossChainRelay.send() ...'),
    ()=>addTxLog('success','[<span class="t-green">SUCCESS</span>] ECDSA 签名完成 | sig: <span class="t-yellow">'+fakeHash('sig').slice(0,18)+'...</span>'),
    ()=>addTxLog('info','[INFO]  gRPC 转发至主监管链，延迟 18ms ...'),
    ()=>{addTxLog('success','[<span class="t-green">SUCCESS</span>] 签名验证通过 ✓ | TX: <span class="t-yellow">'+fakeHash('tx').slice(0,18)+'...</span>');addTxLog('success','[<span class="t-green">SUCCESS</span>] 数据写入主链 Block <span class="t-yellow">#'+(mainBlockH.value+1)+'</span>')}
  ]
  const iv=setInterval(()=>{
    txStepIdx.value=step
    if(step<msgs.length)msgs[step]()
    step++
    if(step>txSteps.length){clearInterval(iv);txLoading.value=false;txDone.value=true;ElMessage.success('跨链传输完成')}
  },600)
}
const queryLoading=ref(false),queryDone=ref(false),anomalyLoading=ref(false),anomalyDone=ref(false)
const queryPartDid=ref(vcParts[0].did),activeSubName=ref('chain-mfr-001')
const mainLatency=ref(0),subLatency=ref(0),mainBlockHash=ref(''),subBlockHash=ref('')
const consistencyOk=ref(true),diffCount=ref(0),mainResult=ref([]),subResult=ref([])
const anomalyScenarios=ref([]),queryTermLogs=ref([]),queryTermRef=ref(null)
let queryTermId=0
function addQueryLog(type,html){queryTermLogs.value.push({id:queryTermId++,type,html});nextTick(()=>{if(queryTermRef.value)queryTermRef.value.scrollTop=queryTermRef.value.scrollHeight})}
const querySummary=computed(()=>[
  {label:'主链响应',value:mainLatency.value+'ms',color:'#4a90e2'},
  {label:'子链响应',value:subLatency.value+'ms',color:'#4a90e2'},
  {label:'差异字段',value:String(diffCount.value),color:diffCount.value===0?'#48bb78':'#f56565'},
  {label:'数据一致性',value:consistencyOk.value?'完全一致':'存在差异',color:consistencyOk.value?'#48bb78':'#f56565'},
  {label:'收敛时间',value:'< 5s',color:'#48bb78'}
])
const fields=[
  {key:'零部件 DID',val:()=>queryPartDid.value},
  {key:'批次号',val:()=>'B20240301'},
  {key:'生产商',val:()=>'生产商A (DID_M001)'},
  {key:'质检结果',val:()=>'合格'},
  {key:'物流状态',val:()=>'已到货'},
  {key:'事件数量',val:()=>'4'},
  {key:'凭证数量',val:()=>'3'}
]
function runQuery(){
  queryLoading.value=true;queryDone.value=false;queryTermLogs.value=[]
  activeSubName.value=subChains[0].chainId
  addQueryLog('prompt','<span class="t-sym">$</span> chainmaker-client cross-chain query --did <span class="t-cyan">'+queryPartDid.value+'</span> --chains all')
  setTimeout(()=>addQueryLog('info','[INFO]  向主监管链 chain-supervisor-001 发起查询...'),200)
  setTimeout(()=>addQueryLog('info','[INFO]  向子链 chain-mfr-001 发起查询...'),480)
  setTimeout(()=>{
    mainLatency.value=Math.floor(Math.random()*30)+40
    subLatency.value=Math.floor(Math.random()*25)+35
    mainBlockHash.value=fakeHash('main'+queryPartDid.value).slice(0,42)
    subBlockHash.value=fakeHash('sub'+queryPartDid.value).slice(0,42)
    consistencyOk.value=true;diffCount.value=0
    mainResult.value=fields.map(f=>({key:f.key,value:f.val()}))
    subResult.value=fields.map(f=>({key:f.key,value:f.val(),diff:false}))
    addQueryLog('success','[<span class="t-green">SUCCESS</span>] 主链 <span class="t-yellow">'+mainLatency.value+'ms</span> | 子链 <span class="t-yellow">'+subLatency.value+'ms</span>')
    addQueryLog('success','[<span class="t-green">SUCCESS</span>] 数据完全一致，差异字段：0 ✓')
    queryLoading.value=false;queryDone.value=true
    ElMessage.success('主从链查询完成，数据完全一致')
  },900)
}
function runAnomalyTest(){
  anomalyLoading.value=true;anomalyDone.value=false
  setTimeout(()=>{
    anomalyScenarios.value=[
      {name:'网络延迟',icon:'Timer',  color:'#667eea',desc:'模拟 2s 网络抖动',      response:'消息队列缓冲自动重试',convergence:'< 5s'},
      {name:'节点宕机',icon:'Warning',color:'#ed8936',desc:'子链 peer0 宕机',            response:'TBFT 故障转移至 peer1',             convergence:'< 3s'},
      {name:'消息重复',icon:'CopyDocument',color:'#38b2ac',desc:'网络闪断导致重发',response:'幂等校验去重',  convergence:'即时'}
    ]
    anomalyLoading.value=false;anomalyDone.value=true
    ElMessage.success('异常场景测试完成')
  },1000)
}
</script>

<style scoped>
.exp-container{display:flex;flex-direction:column;gap:20px}
.exp-header{display:flex;justify-content:space-between;align-items:flex-start;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid rgba(74,144,226,.25);border-radius:16px;padding:24px 28px}
.exp-header-left h2{font-size:22px;font-weight:700;color:#1e293b;margin:6px 0 4px}
.exp-header-left p{font-size:13px;color:#94a3b8;margin:0}
.exp-badge{display:inline-block;background:rgba(74,144,226,.2);color:#2563eb;font-size:11px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:20px;border:1px solid rgba(74,144,226,.3)}
.exp-status-bar{display:flex;flex-direction:column;gap:8px}
.status-pill{display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600}
.status-pill.ok{background:rgba(72,187,120,.12);color:#16a34a;border:1px solid rgba(72,187,120,.25)}
.status-pill .dot{width:7px;height:7px;border-radius:50%;background:#16a34a;animation:pdot 2s infinite}
@keyframes pdot{0%,100%{opacity:1}50%{opacity:.4}}
.exp-tabs{display:flex;gap:12px;flex-wrap:wrap}
.exp-tab{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;background:#ffffff;border:1px solid #e2e8f0;cursor:pointer;transition:all .2s;font-size:13px;color:#64748b}
.exp-tab:hover{border-color:#2563eb;color:#3b82f6}
.exp-tab.active{background:rgba(74,144,226,.12);border-color:#2563eb;color:#2563eb}
.tab-result{margin-left:auto;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
.tab-result.ok{background:rgba(72,187,120,.15);color:#16a34a}
.panel{background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:24px;display:flex;flex-direction:column;gap:20px}
.panel-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e2e8f0}
.panel-header h3{font-size:16px;font-weight:700;color:#1e293b;margin:0 0 4px}
.panel-desc{font-size:13px;color:#94a3b8;margin:0}
.result-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
.summary-card{background:#f8fafc;border-radius:10px;padding:14px;border:1px solid;text-align:center}
.summary-val{font-size:22px;font-weight:700;margin-bottom:4px}
.summary-label{font-size:12px;color:#64748b}
.topo-wrap{background:#f8fafc;border-radius:12px;padding:18px;border:1px solid #e2e8f0}
.topo-label{font-size:12px;font-weight:600;color:#64748b;margin-bottom:14px}
.topo-graph{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:start}
.chain-block{border-radius:12px;border:2px solid #e2e8f0;overflow:hidden;background:#f8fafc;transition:all .4s}
.chain-block.online{border-color:rgba(72,187,120,.4)}
.main-chain .chain-header{background:#2563eb}
.sub-chain .chain-header{background:#16a34a;color:white}
.chain-header{display:flex;align-items:center;gap:8px;padding:10px 14px;color:white;font-size:13px;font-weight:700}
.chain-logo{background:rgba(255,255,255,.15);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:800;font-family:monospace}
.chain-tech{font-size:11px;color:#94a3b8;padding:4px 14px}
.chain-id{font-size:10px;color:#2563eb;padding:0 14px 4px;font-family:monospace}
.chain-nodes{display:flex;flex-wrap:wrap;gap:6px;padding:6px 14px}
.node-pill{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b;padding:3px 8px;border-radius:6px;background:#f8fafc;transition:.3s}
.node-pill.active{color:#16a34a;background:rgba(72,187,120,.1)}
.ndot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.ndot.ok{background:#16a34a}.ndot.off{background:#94a3b8}
.chain-contracts{display:flex;flex-direction:column;gap:3px;padding:4px 14px 8px}
.ctag{font-size:11px;color:#2563eb}
.chain-owner{font-size:11px;color:#94a3b8;padding:0 14px 4px}
.chain-status-row{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:6px 14px 10px;color:#64748b}
.sdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.sdot.ok{background:#16a34a;animation:pdot 2s infinite}.sdot.off{background:#94a3b8}
.gateway-col{display:flex;flex-direction:column;gap:12px}
.gw-label{font-size:11px;font-weight:700;color:#2563eb;text-align:center}
.gw-box{border-radius:12px;border:1px solid #e2e8f0;background:#ffffff;padding:14px;text-align:center;transition:.4s}
.gw-box.active{border-color:rgba(74,144,226,.4);background:rgba(74,144,226,.06)}
.gw-icon{font-size:26px;margin-bottom:6px}
.gw-name{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:2px}
.gw-proto{font-size:10px;color:#94a3b8;margin-bottom:8px}
.gw-nodes{display:flex;flex-direction:column;gap:4px}
.gw-node{display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b}
.gw-node.active{color:#16a34a}
.policy-box{border-radius:10px;border:1px solid #e2e8f0;background:#ffffff;padding:12px;font-size:11px;transition:.4s}
.policy-box.active{border-color:rgba(74,144,226,.3)}
.policy-title{font-weight:700;color:#2563eb;margin-bottom:6px}
.policy-item{color:#64748b;margin-bottom:2px}
.sub-chains-col{display:flex;flex-direction:column;gap:12px}
.sdk-terminal{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden}
.term-bar{display:flex;align-items:center;gap:6px;background:#e2e8f0;padding:8px 12px;border-bottom:1px solid #cbd5e1}
.term-dot{width:10px;height:10px;border-radius:50%}
.term-dot.red{background:#dc2626}.term-dot.yellow{background:#d97706}.term-dot.green{background:#16a34a}
.term-title{font-size:11px;color:#64748b;margin-left:6px;font-family:monospace}
.term-spacer{flex:1}
.term-badge{font-size:10px;color:#16a34a;background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:1px 7px}
.term-body{padding:12px 14px;font-family:monospace;font-size:11px;min-height:120px;max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:3px}
.term-line{line-height:1.6;white-space:pre-wrap;word-break:break-all}
.term-line.prompt{color:#475569}.term-line.info{color:#64748b}.term-line.success{color:#15803d}
.term-cursor{color:#2563eb;animation:blink 1s step-end infinite;font-size:13px}
.t-sym{color:#d97706}.t-cyan{color:#0891b2}.t-green{color:#15803d}.t-yellow{color:#d97706}.t-blue{color:#3b82f6}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.msg-builder{background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0}
.mb-title{font-size:12px;font-weight:600;color:#64748b;margin-bottom:12px}
.mb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.mb-field{display:flex;flex-direction:column;gap:4px}
.mb-field label{font-size:11px;color:#94a3b8}
.transfer-flow{display:flex;align-items:stretch;background:#f8fafc;border-radius:12px;padding:20px 16px;border:1px solid #e2e8f0;overflow-x:auto;gap:0}
.flow-step{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:90px;opacity:.4;transition:.4s}
.flow-step.active,.flow-step.current{opacity:1}
.fs-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white}
.fs-name{font-size:12px;font-weight:600;color:#1e293b;text-align:center}
.fs-desc{font-size:10px;color:#64748b;text-align:center}
.fs-result{font-size:10px;color:#16a34a;display:flex;align-items:center;gap:3px}
.flow-connector{display:flex;align-items:center;font-size:18px;color:#94a3b8;padding:0 4px;flex-shrink:0;margin-top:10px;transition:.4s}
.flow-connector.filled{color:#2563eb}
.query-bar{display:flex;align-items:center;gap:12px}
.qb-label{font-size:13px;color:#64748b;white-space:nowrap}
.query-compare{display:grid;grid-template-columns:1fr 110px 1fr;gap:14px;align-items:start}
.compare-panel{border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;background:#f8fafc}
.cp-header{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #e2e8f0}
.cp-header.main{background:#dbeafe}
.cp-header.sub{background:#dcfce7}
.chain-badge{font-size:11px;font-weight:700;padding:2px 10px;border-radius:12px}
.chain-badge.main{background:rgba(74,144,226,.2);color:#2563eb}
.chain-badge.sub{background:rgba(72,187,120,.2);color:#16a34a}
.chain-name{font-size:12px;color:#64748b;flex:1;font-family:monospace}
.chain-latency{font-size:11px;color:#16a34a;font-family:monospace}
.cp-fields{padding:12px 16px;display:flex;flex-direction:column;gap:8px}
.cp-row{display:flex;gap:10px;font-size:12px;align-items:center}
.cp-row.diff{background:rgba(237,137,54,.08);border-radius:4px;padding:2px 6px;margin:0 -6px}
.cp-key{color:#94a3b8;width:90px;flex-shrink:0;font-size:11px}
.cp-val{color:#1e293b;flex:1}
.diff-val{color:#ca8a04;font-weight:600}
.cp-hash{display:flex;flex-direction:column;gap:4px;padding:10px 16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
.hash-main{font-family:monospace;font-size:10px;color:#2563eb;word-break:break-all}
.hash-sub{font-family:monospace;font-size:10px;color:#16a34a;word-break:break-all}
.compare-middle{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px 0}
.cm-arrow{font-size:24px;color:#94a3b8}
.consistency-badge{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700}
.consistency-badge.ok{background:rgba(72,187,120,.15);color:#16a34a;border:1px solid rgba(72,187,120,.3)}
.consistency-badge.fail{background:rgba(245,101,101,.15);color:#dc2626;border:1px solid rgba(245,101,101,.3)}
.diff-count{font-size:11px;color:#94a3b8}
.anomaly-result{background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0}
.ar-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px}
.ar-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.ar-card{border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}
.ar-header{display:flex;align-items:center;gap:8px;padding:10px 14px;color:white;font-size:13px;font-weight:600}
.ar-body{padding:12px 14px;background:#ffffff;display:flex;flex-direction:column;gap:8px}
.ar-row{display:flex;gap:10px;font-size:12px}
.ar-row span{color:#94a3b8;width:40px;flex-shrink:0}
.text-ok{color:#16a34a}
</style>
