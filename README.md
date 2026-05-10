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

### 手动部署

#### 环境要求

- **Bun >= 1.0**（后端）
- **Node.js >= 20.x**（前端）
- **Nginx**（推荐用于反向代理）

#### 安装依赖

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 安装 Node.js（使用 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

#### 后端部署

```bash
cd backend
bun install
bun run build

# 开发模式
bun run dev

# 生产模式（推荐使用 pm2）
npm install -g pm2
pm2 start dist/index.js --name bookmark-backend
pm2 startup
pm2 save
```

后端服务默认运行在 http://localhost:3000

#### 前端部署

```bash
cd frontend
npm install
npm run build

# 将构建产物复制到 Nginx 目录
cp -r dist/* /var/www/html/
```

#### Nginx 配置

创建配置文件 `/etc/nginx/sites-available/bookmark-manager`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
ln -s /etc/nginx/sites-available/bookmark-manager /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 环境变量（可选）

在后端目录创建 `.env` 文件：

```bash
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
NODE_ENV=production
```

## 🔒 安全配置

本系统实现了多层安全防护机制：

### 1. 安全响应头

| 头信息 | 值 | 作用 |
|--------|-----|------|
| X-Content-Type-Options | nosniff | 防止 MIME 类型嗅探 |
| X-Frame-Options | DENY | 防止点击劫持攻击 |
| X-XSS-Protection | 1; mode=block | XSS 攻击防护 |
| Content-Security-Policy | strict CSP | 内容安全策略 |
| Strict-Transport-Security | max-age=31536000 | 强制 HTTPS |

### 2. 速率限制

| 端点 | 限制 | 窗口时间 |
|------|------|----------|
| 注册 | 5 次/分钟 | 严格限制 |
| 登录 | 10 次/分钟 | 防止暴力破解 |
| 其他 API | 200 次/分钟 | 通用限制 |

### 3. 强密码策略

- 最少 8 位字符
- 必须包含大写字母
- 必须包含小写字母
- 必须包含数字
- 必须包含特殊字符 (@$!%*?&)

### 4. 跨域访问控制 (CORS)

默认允许的来源：
- `http://localhost:5173` (开发环境)
- `http://localhost:8080` (Docker 环境)

生产环境请通过 `ALLOWED_ORIGINS` 环境变量配置。

### 5. 请求日志与监控

- 记录所有 API 请求
- 检测可疑请求（SQL注入、XSS等）
- 请求频率统计
- 用户行为追踪

### 6. 认证安全

- JWT Token 认证
- Token 有效期 7 天
- 支持 Token 刷新
- 安全登出机制

### 7. SQL 注入防护

- 使用 Drizzle ORM 参数化查询
- 输入验证与过滤
- 可疑 SQL 模式检测

#### 更新代码

```bash
git pull origin main

# 重新构建后端
cd backend
bun run build
pm2 restart bookmark-backend

# 重新构建前端
cd frontend
npm run build
cp -r dist/* /var/www/html/
```

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
