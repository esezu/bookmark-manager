# 📚 Bookmark Manager

一个功能强大的书签管理系统，支持集中式管理书签，解决跨设备、跨平台、跨浏览器的同步与访问难题。

## ✨ 功能特点

- 🔐 **用户认证** - 支持用户注册、登录、JWT Token 认证
- 📁 **书签管理** - 完整的 CRUD 操作，支持分类和标签
- 🗂️ **分类管理** - 支持二级分类，拖拽排序
- 🏷️ **标签管理** - 自定义标签颜色，灵活的标签筛选
- 👥 **多用户** - 支持多用户系统，管理员权限
- 📤 **导入导出** - 支持 Chrome/Firefox 书签导入，HTML/JSON 格式导出
- 📱 **响应式设计** - 完美适配桌面端和移动端

## 🛠️ 技术栈

- **后端**: Bun + Hono.js + SQLite3 (Drizzle ORM)
- **前端**: Vue3 + Naive UI + Tailwind CSS
- **构建工具**: Vite

## 🚀 快速开始

### 开发模式

#### 后端启动

```bash
cd backend
bun install
bun run dev
```

后端服务将运行在 http://localhost:3000

#### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在 http://localhost:5173

### Docker 部署

```bash
docker-compose up -d
```

访问 http://localhost:8080 即可使用。

## 📖 API 文档

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/logout | 用户登出 |
| GET | /api/v1/auth/me | 获取当前用户信息 |

### 书签接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/bookmarks | 获取书签列表 |
| GET | /api/v1/bookmarks/:id | 获取单个书签 |
| POST | /api/v1/bookmarks | 创建书签 |
| PUT | /api/v1/bookmarks/:id | 更新书签 |
| DELETE | /api/v1/bookmarks/:id | 删除书签 |

### 分类接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/categories | 获取分类列表 |
| POST | /api/v1/categories | 创建分类 |
| PUT | /api/v1/categories/:id | 更新分类 |
| DELETE | /api/v1/categories/:id | 删除分类 |

### 标签接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/tags | 获取标签列表 |
| POST | /api/v1/tags | 创建标签 |
| PUT | /api/v1/tags/:id | 更新标签 |
| DELETE | /api/v1/tags/:id | 删除标签 |

### 导入导出

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/import | 导入书签 |
| GET | /api/v1/export | 导出书签 |

## 📁 项目结构

```
bookmark-manager/
├── backend/                 # Hono.js 后端
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── db/             # 数据库
│   │   ├── middleware/     # 中间件
│   │   └── utils/         # 工具函数
│   └── Dockerfile
├── frontend/               # Vue3 前端
│   ├── src/
│   │   ├── views/         # 页面
│   │   ├── components/     # 组件
│   │   ├── stores/         # Pinia 状态管理
│   │   └── api/            # API 配置
│   └── Dockerfile
├── docker-compose.yml      # Docker 部署配置
└── README.md
```

## 📝 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
