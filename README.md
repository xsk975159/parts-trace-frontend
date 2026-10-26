# 零部件可信溯源前端

Vue 3与Element Plus前端，通过后端API管理单件身份、业务记录、凭证和质量异常。本文命令与文件路径均相对于 `parts-trace-frontend/`。

## 1. 安装与启动

需要Node.js和npm。已有构建记录使用Node.js 22，依赖版本以[package-lock.json](package-lock.json)为准，脚本以[package.json](package.json)为准。

```powershell
npm ci
npm run dev
```

开发服务默认地址为 `http://localhost:5173`。后端须另行启动，默认端口8080；首页可打开不代表登录和业务API已经可用。停止服务按 `Ctrl+C`。

## 2. 实际目录

| 路径 | 内容 |
| --- | --- |
| [src/main.js](src/main.js) | 创建Vue应用并注册Element Plus、路由与状态管理 |
| [src/router/index.js](src/router/index.js) | 全部页面路由与登录守卫 |
| `src/layout/` | 页面布局与菜单 |
| `src/views/` | 登录、工作台、用户、零部件、追溯、异常及统计页面 |
| `src/api/` | 用户、DID、零部件、追溯、异常和统计API封装 |
| [src/utils/request.js](src/utils/request.js) | Axios接口基址、令牌和响应处理 |
| `src/store/modules/` | `user`、`parts`、`trace`、`anomaly`状态模块 |
| `src/styles/` | 页面样式 |
| `public/` | 不经过模块打包的静态文件 |
| [vite.config.js](vite.config.js) | 开发代理、路径别名和构建输出 |
| `dist/` | 执行生产构建后生成的静态文件 |

当前项目没有独立的管理端/客户端路由文件，也不使用 `src/apis/` 目录。实际API封装统一位于 `src/api/`。

## 3. 页面与接口范围

| 页面路径 | 内容 |
| --- | --- |
| `/login` | 登录 |
| `/dashboard` | 工作台与概览 |
| `/profile` | 本人DID、签名密钥、历史明文密钥迁移及管理员任务入口 |
| `/user/list`、`/user/role`、`/user/permission` | 用户、角色与权限 |
| `/parts/category`、`/parts/list`、`/parts/did` | 分类、主数据、单件及DID |
| `/trace/workbench`、`/trace/event`、`/trace/certificate` | 批次操作、事件记录及凭证 |
| `/anomaly/rule`、`/anomaly/alert` | 质量规则与异常处置 |
| `/query` | 追溯核验、跨链拓扑/中继记录及报告导出 |
| `/statistics` | 根据后端持久化数据展示统计 |

当前页面展示跨链拓扑和中继记录，不提供独立的通用区块浏览器或节点运维界面。权限与业务范围以[后端功能说明](../parts-trace-backend/docs/功能与数据说明.md)为准。

## 4. API与登录

Axios默认接口基址是 `/api`，超时为15000毫秒。开发时Vite将 `/api` 转发到 `http://localhost:8080`，保留路径前缀。后端端口变化时应同步修改Vite代理目标。

`VITE_API_BASE_URL`可覆盖接口基址，例如在忽略提交的 `.env.local` 中设置。该变量不会修改Vite代理目标，生产构建时取值，修改后需要重启开发服务或重新构建。

`src/api/`中的接口路径通常不重复写 `/api`。登录令牌保存在 `localStorage` 的 `token` 项中，请求通过 `Authorization: Bearer <token>` 携带；注销调用后端接口并清理本地状态。路由守卫只控制页面进入，服务端仍独立检查账号、权限及业务归属。

新库管理员初始账号为 `admin / admin123`；已有库以实际密码为准。数据库与后端启动见[运行说明](../parts-trace-backend/docs/运行说明.md)。

## 5. 构建与部署

```powershell
npm run build
npm run preview
```

生产静态文件生成到 `dist/`。正式Web服务需提供SPA页面回退，并把 `/api` 转发到后端。本项目Vite 4的`npm run preview`在未单独配置`preview.proxy`时沿用开发代理；部署到其他Web服务时仍需配置该服务自己的API转发。完整部署关系见[部署说明](../parts-trace-backend/docs/部署说明.md)。
