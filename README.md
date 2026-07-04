# 零部件溯源系统 - 前端项目

## 项目简介

基于Vue 3 + Element Plus的零部件溯源系统前端应用。

## 技术栈

- **框架**: Vue 3
- **UI组件库**: Element Plus
- **构建工具**: Vite
- **状态管理**: Vuex
- **路由**: Vue Router
- **HTTP客户端**: Axios

## 项目结构

```
parts-trace-frontend/
├── src/
│   ├── views/                  # 页面组件
│   │   ├── parts/              # 零部件管理
│   │   │   ├── PartsList.vue   # 零部件列表
│   │   │   ├── PartsRegister.vue # 零部件注册
│   │   │   └── PartsDetail.vue # 零部件详情
│   │   ├── trace/              # 溯源管理
│   │   │   ├── TraceQuery.vue  # 溯源查询
│   │   │   └── TraceHistory.vue # 溯源历史
│   │   ├── chain/              # 区块链信息
│   │   │   ├── ChainInfo.vue   # 链信息
│   │   │   └── BlockQuery.vue   # 区块查询
│   │   ├── Login.vue           # 登录页面
│   │   └── Register.vue        # 注册页面
│   ├── components/             # 公共组件
│   │   ├── KeWeiHeadNav.vue    # 头部导航
│   │   ├── KeWeiAsideMenu.vue  # 侧边菜单
│   │   ├── KeWeiTable.vue      # 表格组件
│   │   ├── KeWeiInput.vue      # 输入框组件
│   │   └── KeWeiButton.vue     # 按钮组件
│   ├── router/                 # 路由配置
│   │   ├── index.js            # 路由主文件
│   │   ├── manageNavRouter.js  # 管理端路由
│   │   └── clientNavRouter.js  # 客户端路由
│   ├── store/                  # Vuex状态管理
│   │   ├── index.js            # Store主文件
│   │   ├── modules/
│   │   │   ├── user.js         # 用户模块
│   │   │   └── parts.js        # 零部件模块
│   ├── apis/                   # API接口
│   │   ├── request.js          # Axios配置
│   │   ├── parts.js            # 零部件接口
│   │   ├── trace.js            # 溯源接口
│   │   └── chain.js            # 区块链接口
│   ├── utils/                  # 工具函数
│   │   ├── auth.js             # 认证工具
│   │   └── common.js           # 通用工具
│   ├── assets/                 # 静态资源
│   │   ├── css/
│   │   │   ├── main.css
│   │   │   └── base.css
│   │   └── images/
│   ├── App.vue                 # 根组件
│   └── main.js                 # 入口文件
├── public/                     # 公共资源
├── index.html                  # HTML模板
├── vite.config.js              # Vite配置
└── package.json                # 项目配置
```

## 开发指南

### 环境要求

- Node.js 16.0+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发运行

```bash
npm run dev
# 或
yarn dev
```

访问地址: http://localhost:5173

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

### 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

## 功能模块

### 1. 零部件管理
- 零部件列表查询
- 零部件注册
- 零部件详情查看
- 零部件信息编辑

### 2. 溯源管理
- 溯源信息查询
- 溯源历史查看
- 溯源记录添加

### 3. 区块链信息
- 链信息查看（区块高度、节点数量等）
- 区块查询
- 交易查询

### 4. 系统管理
- 用户管理
- 机构管理
- 权限管理

## API配置

在 `src/apis/request.js` 中配置API基础地址：

```javascript
const service = axios.create({
  baseURL: 'http://localhost:9527/api', // 后端API地址
  timeout: 10000
})
```

## 路由配置

路由分为管理端路由和客户端路由：
- 管理端路由: `src/router/manageNavRouter.js`
- 客户端路由: `src/router/clientNavRouter.js`

## 状态管理

使用Vuex进行状态管理，主要模块：
- `user`: 用户信息、登录状态
- `parts`: 零部件相关状态

## 组件说明

### KeWeiTable
统一的表格组件，支持：
- 分页
- 排序
- 筛选
- 自定义列

### KeWeiInput
统一的输入框组件，支持：
- 验证
- 格式化
- 自定义样式

## 注意事项

1. 所有API请求都需要携带Token（除登录接口外）
2. Token存储在localStorage中
3. Token过期后自动跳转到登录页
4. 使用Element Plus组件库，注意版本兼容性

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License
