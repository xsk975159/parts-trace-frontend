# 工业零部件可信溯源前端

前端使用 Vue 3、Element Plus、Vue Router、Vuex 和 Vite，通过后端 API 管理零部件单件身份、生产、质检和物流记录、可验证凭证与质量异常。本文命令和源码路径相对于 `parts-trace-frontend/`。

## 安装与启动

准备 Node.js 和 npm，已有构建使用 Node.js 22。依赖版本以 [package-lock.json](package-lock.json) 为准，命令以 [package.json](package.json) 为准。

先按[后端运行说明](../parts-trace-backend/docs/运行说明.md)启动后端，再在本目录执行：

```powershell
npm ci
npm run dev
```

开发页面默认地址为 `http://localhost:5173`。若端口占用，Vite 会尝试后续端口，以终端输出为准。开发服务按 `Ctrl+C` 停止。新库管理员为 `admin / admin123`，已有数据库使用实际账号密码。

## 接口与前后端联调

| 项目 | 当前配置 |
| --- | --- |
| 前端开发服务 | 默认 5173，配置在 [vite.config.js](vite.config.js) |
| 后端 API | 默认 `http://localhost:8080/api` |
| 请求基址 | `/api`，可由 `VITE_API_BASE_URL` 覆盖 |
| Vite 开发代理 | `/api` 转发到 `http://localhost:8080`，保留前缀 |
| 请求超时 | 15000 毫秒，配置在 [request.js](src/utils/request.js) |
| 登录令牌 | `localStorage.token`，通过 `Authorization: Bearer <token>` 发送 |

修改后端端口时，同步修改 `vite.config.js` 的 `server.proxy['/api'].target` 并重启开发服务。设置 `VITE_API_BASE_URL` 只改变请求基址，不会改写代理目标。开发环境可在忽略提交的 `.env.local` 中配置，例如：

```dotenv
VITE_API_BASE_URL=/api
```

Vite 在启动或构建时读取环境配置，修改后需重启或重新构建。`src/api/` 中的接口路径相对于请求基址，例如 `/login` 对应后端 `/api/login`。普通 JSON 响应按业务 `code` 判断结果，文件下载按 Blob 处理；登录失效时清理令牌并转到登录页。路由守卫控制页面进入，接口权限、账号状态和业务归属由后端检查。

独立版 EXE 的默认页面端口为 18080，页面和 API 由同一个 JAR 提供，不需要另开 Vite。需要将开发页面连接到独立版时，应将 Vite 代理目标改为其实际端口。

## 页面与代码位置

| 页面路径 | 功能 |
| --- | --- |
| `/login`、`/dashboard` | 登录、工作台与概览 |
| `/profile` | 本人 DID、签名密钥、明文密钥迁移与管理员任务入口 |
| `/user/list`、`/user/role`、`/user/permission` | 用户、角色和权限 |
| `/parts/category`、`/parts/list`、`/parts/did` | 分类、主数据、单件与 DID |
| `/trace/workbench`、`/trace/event`、`/trace/certificate` | 批次操作、事件与凭证 |
| `/anomaly/rule`、`/anomaly/alert` | 质量规则、异常及冻结处置 |
| `/query` | 追溯核验、跨链拓扑和中继记录、报告导出 |
| `/statistics` | 根据后端持久化数据展示统计 |

入口为 [src/main.js](src/main.js)，路由和登录守卫位于 [src/router/index.js](src/router/index.js)。页面在 `src/views/`，布局和菜单在 `src/layout/`，接口封装在 `src/api/`，样式在 `src/styles/`；`src/store/modules/` 包含 `user`、`parts`、`trace` 和 `anomaly` 状态模块。

业务对象、阶段权限、存证状态和接口定义见[功能与数据说明](../parts-trace-backend/docs/功能与数据说明.md)。跨链页面展示后端返回的链配置、中继记录及可选核验摘要，真实节点连接由后端维护。

## 生产构建与部署

```powershell
npm run build
npm run preview
```

静态产物位于 `dist/`，本地预览默认端口为 4173。本项目锁定的 Vite 4.5.14 在未设置 `preview.proxy` 时沿用开发代理，预览联调仍需启动后端。

部署到 Nginx 等 Web 服务时，将 `dist/` 作为静态目录，配置 Vue 页面路由回退到 `index.html`，并将 `/api` 转发至后端、保留前缀。Web 服务的代理独立配置，不读取 Vite 的开发代理。

将页面嵌入后端 JAR 时，先完成本目录构建，再到后端执行 `mvn -Pwindows-package package`。Windows 打包脚本自动完成前端构建和 JAR 资源打包，启动器负责启用桌面页面路由。完整部署方式见[部署说明](../parts-trace-backend/docs/部署说明.md)。

## 常见联调问题

| 现象 | 检查位置 |
| --- | --- |
| 页面能打开，登录或请求失败 | 后端是否启动、数据库连接、Vite 代理目标及 `/api` 前缀 |
| 登录后又返回登录页 | 账号状态、令牌有效期、后端 JWT 配置 |
| 改了 API 地址仍访问旧地址 | 重启开发服务，或重新构建并更新实际部署的 `dist/` |
| 部署后刷新业务页面出现 404 | Web 服务的 SPA 回退；JAR 部署同时核对静态资源及桌面页面配置 |
| 跨链记录显示失败或待处理 | 后端任务错误和链配置，按[双平台接入说明](../parts-trace-backend/docs/双平台接入说明.md)核对 |
