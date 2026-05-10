# 书签管理系统 (Bookmark Manager) - 设计文档

**日期**: 2026-05-10
**版本**: v1.0.0

## 1. 项目概述

### 1.1 项目简介
一款功能强大的浏览器书签管理系统，采用 Bun + Hono.js + SQLite3 + Vue3 + Naive UI + Tailwind CSS 技术栈开发。支持集中式管理书签，解决跨设备、跨平台、跨浏览器的同步与访问难题。

### 1.2 技术栈
- **后端**: Bun + Hono.js
- **数据库**: SQLite3 (使用 Drizzle ORM)
- **前端**: Vue3 + Naive UI + Tailwind CSS
- **构建工具**: Vite

## 2. 项目架构

### 2.1 项目结构

```
bookmark-manager/
├── backend/                    # Hono.js 后端
│   ├── src/
│   │   ├── index.ts           # 应用入口
│   │   ├── app.ts             # Hono 应用配置
│   │   ├── routes/            # 路由模块
│   │   │   ├── auth.ts        # 认证相关
│   │   │   ├── bookmark.ts    # 书签管理
│   │   │   ├── category.ts    # 分类管理
│   │   │   ├── tag.ts         # 标签管理
│   │   │   ├── user.ts        # 用户管理
│   │   │   └── import-export.ts # 导入导出
│   │   ├── db/                # 数据库
│   │   │   ├── index.ts       # 数据库连接
│   │   │   └── schema.ts      # Drizzle Schema
│   │   ├── middleware/        # 中间件
│   │   │   ├── auth.ts        # 认证中间件
│   │   │   └── cors.ts        # CORS 配置
│   │   ├── services/          # 业务逻辑
│   │   │   ├── auth.service.ts
│   │   │   ├── bookmark.service.ts
│   │   │   ├── category.service.ts
│   │   │   └── user.service.ts
│   │   └── utils/             # 工具函数
│   │       ├── hash.ts        # 密码哈希
│   │       └── response.ts    # 响应封装
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Vue3 前端
│   ├── src/
│   │   ├── main.ts           # 入口文件
│   │   ├── App.vue           # 根组件
│   │   ├── router/           # 路由
│   │   │   └── index.ts
│   │   ├── views/            # 页面
│   │   │   ├── Home.vue      # 首页
│   │   │   ├── Login.vue     # 登录
│   │   │   ├── Register.vue   # 注册
│   │   │   ├── admin/        # 管理后台
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── Bookmarks.vue
│   │   │   │   ├── Categories.vue
│   │   │   │   ├── Tags.vue
│   │   │   │   ├── Users.vue
│   │   │   │   └── Settings.vue
│   │   ├── components/       # 组件
│   │   │   ├── layout/       # 布局组件
│   │   │   ├── bookmark/     # 书签组件
│   │   │   └── common/        # 通用组件
│   │   ├── stores/           # Pinia 状态管理
│   │   │   ├── auth.ts
│   │   │   ├── bookmark.ts
│   │   │   └── category.ts
│   │   ├── api/              # API 调用
│   │   │   └── index.ts
│   │   └── styles/           # 样式
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/                      # 文档
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 3. 数据库设计

### 3.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │ categories  │       │    tags     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id           │       │ id          │
│ username    │       │ user_id (FK) │       │ user_id(FK) │
│ password    │       │ name         │       │ name        │
│ email       │       │ parent_id    │       │ color       │
│ role        │       │ sort_order   │       │ created_at  │
│ created_at  │       │ created_at   │       └──────┬──────┘
│ updated_at  │       └───────┬───────┘              │
└──────┬──────┘               │                      │
       │                      │                      │
       │              ┌───────┴───────┐              │
       │              │               │              │
       │      ┌───────┴───────┐       │       ┌─────┴─────┐
       │      │   bookmarks   │       │       │bookmark_tags│
       │      ├───────────────┤       │       ├───────────┤
       └──────│ id            │       │       │bookmark_id │
              │ user_id (FK)  │───────┘       │ tag_id(FK) │
              │ category_id(FK)│               └───────────┘
              │ title         │
              │ url           │
              │ description   │
              │ favicon       │
              │ alt_url       │
              │ is_private   │
              │ sort_order   │
              │ created_at   │
              │ updated_at   │
              └───────────────┘
```

### 3.2 表结构

#### 3.2.1 users (用户表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 用户ID |
| username | TEXT | UNIQUE, NOT NULL | 用户名 |
| password | TEXT | NOT NULL | 密码哈希 |
| email | TEXT | UNIQUE | 邮箱 |
| role | TEXT | NOT NULL DEFAULT 'user' | 角色 (admin/user) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.2.2 categories (分类表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 分类ID |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| name | TEXT | NOT NULL | 分类名称 |
| parent_id | INTEGER | NULL, FOREIGN KEY (categories.id) | 父分类ID |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 3.2.3 bookmarks (书签表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 书签ID |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| category_id | INTEGER | FOREIGN KEY (categories.id), NULL | 分类ID |
| title | TEXT | NOT NULL | 标题 |
| url | TEXT | NOT NULL | URL |
| description | TEXT | NULL | 描述 |
| favicon | TEXT | NULL | 图标URL |
| alt_url | TEXT | NULL | 备用链接 |
| is_private | INTEGER | DEFAULT 0 | 是否私有 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.2.4 tags (标签表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 标签ID |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| name | TEXT | NOT NULL | 标签名称 |
| color | TEXT | DEFAULT '#3b82f6' | 颜色 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 3.2.5 bookmark_tags (书签标签关联表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| bookmark_id | INTEGER | FOREIGN KEY (bookmarks.id) | 书签ID |
| tag_id | INTEGER | FOREIGN KEY (tags.id) | 标签ID |
| PRIMARY KEY (bookmark_id, tag_id) | | | 复合主键 |

## 4. API 设计

### 4.1 API 基础路径
`/api/v1`

### 4.2 认证 API

#### POST /api/v1/auth/register
注册新用户

**请求体**:
```json
{
  "username": "string",
  "password": "string",
  "email": "string (optional)"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "string"
  }
}
```

#### POST /api/v1/auth/login
用户登录

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "jwt_token",
    "user": {
      "id": 1,
      "username": "string",
      "role": "user"
    }
  }
}
```

#### POST /api/v1/auth/logout
用户登出

#### GET /api/v1/auth/me
获取当前用户信息

### 4.3 书签 API

#### GET /api/v1/bookmarks
获取书签列表

**查询参数**:
- `category_id`: 分类ID (可选)
- `keyword`: 搜索关键词 (可选)
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20)

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "string",
        "url": "string",
        "description": "string",
        "favicon": "string",
        "alt_url": "string",
        "is_private": 0,
        "category": {
          "id": 1,
          "name": "string"
        },
        "tags": [
          {
            "id": 1,
            "name": "string",
            "color": "#3b82f6"
          }
        ],
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### POST /api/v1/bookmarks
创建书签

**请求体**:
```json
{
  "category_id": 1,
  "title": "string",
  "url": "string",
  "description": "string (optional)",
  "alt_url": "string (optional)",
  "is_private": false,
  "tag_ids": [1, 2]
}
```

#### PUT /api/v1/bookmarks/:id
更新书签

#### DELETE /api/v1/bookmarks/:id
删除书签

#### POST /api/v1/bookmarks/check/:id
检测书签状态

#### POST /api/v1/bookmarks/check-all
批量检测所有书签

### 4.4 分类 API

#### GET /api/v1/categories
获取分类列表

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "parent_id": null,
      "sort_order": 0,
      "children": [
        {
          "id": 2,
          "name": "前端",
          "parent_id": 1
        }
      ],
      "bookmark_count": 10
    }
  ]
}
```

#### POST /api/v1/categories
创建分类

#### PUT /api/v1/categories/:id
更新分类

#### DELETE /api/v1/categories/:id
删除分类

### 4.5 标签 API

#### GET /api/v1/tags
获取标签列表

#### POST /api/v1/tags
创建标签

#### PUT /api/v1/tags/:id
更新标签

#### DELETE /api/v1/tags/:id
删除标签

### 4.6 导入导出 API

#### POST /api/v1/import
导入书签

**请求体**:
- `Content-Type: multipart/form-data`
- `file`: HTML 文件 (Chrome/Firefox 书签格式)

**响应**:
```json
{
  "code": 0,
  "message": "导入成功",
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": ["错误信息..."]
  }
}
```

#### GET /api/v1/export
导出书签

**查询参数**:
- `format`: 格式 (html/json, 默认: html)

### 4.7 用户管理 API (管理员)

#### GET /api/v1/admin/users
获取用户列表

#### PUT /api/v1/admin/users/:id
更新用户信息

#### DELETE /api/v1/admin/users/:id
删除用户

## 5. 前端页面设计

### 5.1 页面结构

```
/
├── /                     # 首页 - 书签展示
├── /login               # 登录页
├── /register            # 注册页
├── /search              # 搜索结果页
└── /admin               # 管理后台
    ├── /admin            # 仪表盘
    ├── /admin/bookmarks  # 书签管理
    ├── /admin/categories # 分类管理
    ├── /admin/tags      # 标签管理
    ├── /admin/users     # 用户管理 (管理员)
    └── /admin/settings  # 系统设置
```

### 5.2 首页设计

```
┌─────────────────────────────────────────────────────┐
│  [Logo]     搜索框 [🔍]           [用户菜单 ▼]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  分类导航                                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │全部│ │技术│ │生活│ │娱乐│ │...│    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                                     │
│  书签卡片网格                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │  [icon] │ │  [icon] │ │  [icon] │ │  [icon] │     │
│  │  标题   │ │  标题   │ │  标题   │ │  标题   │     │
│  │  描述   │ │  描述   │ │  描述   │ │  描述   │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 管理后台设计

- 使用 Naive UI 组件库
- 左侧导航菜单
- 顶部工具栏（搜索、操作按钮）
- 表格展示数据
- 模态框进行编辑

## 6. 核心功能

### 6.1 书签管理
- 添加/编辑/删除书签
- 自动获取网站 favicon
- 支持备用链接
- 支持私有书签
- 拖拽排序
- 批量操作

### 6.2 分类管理
- 二级分类支持
- 拖拽排序
- 分类统计

### 6.3 标签管理
- 自定义标签颜色
- 标签筛选

### 6.4 导入导出
- 支持 Chrome/Firefox 书签 HTML 格式
- JSON 格式导出
- 批量导入

### 6.5 用户管理
- 用户注册/登录
- 角色权限 (admin/user)
- 密码修改

### 6.6 链接检测
- 单个检测
- 批量检测
- 显示死链

## 7. 安全设计

### 7.1 认证
- JWT Token 认证
- Token 过期时间: 7 天
- 密码使用 bcrypt 哈希

### 7.2 权限控制
- 用户只能访问自己的数据
- 管理员可访问所有数据
- API 路由权限验证

### 7.3 输入验证
- 请求参数验证
- SQL 注入防护
- XSS 防护

## 8. 部署方案

### 8.1 Docker 部署

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/bookmarks.db
      - JWT_SECRET=your-secret-key

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### 8.2 环境变量

**后端环境变量**:
- `DATABASE_URL`: 数据库路径
- `JWT_SECRET`: JWT 密钥
- `PORT`: 服务端口 (默认 3000)

**前端环境变量**:
- `VITE_API_BASE_URL`: API 基础路径

## 9. 开发计划

### Phase 1: 基础框架搭建
- [ ] 项目结构初始化
- [ ] 后端框架搭建 (Hono + Drizzle)
- [ ] 前端框架搭建 (Vue3 + Vite)
- [ ] 数据库设计实现

### Phase 2: 核心功能开发
- [ ] 用户认证 (注册/登录)
- [ ] 书签 CRUD
- [ ] 分类管理
- [ ] 标签管理

### Phase 3: 高级功能
- [ ] 书签导入导出
- [ ] 链接检测
- [ ] 用户管理 (管理员)

### Phase 4: 优化完善
- [ ] 响应式设计优化
- [ ] 性能优化
- [ ] 错误处理优化
- [ ] 文档完善

## 10. 注意事项

1. 所有 API 响应使用统一格式
2. 使用 TypeScript 确保类型安全
3. 前端使用 Naive UI 组件库
4. 使用 Tailwind CSS 进行样式开发
5. 数据库使用 SQLite3 便于部署
6. 遵循 RESTful API 设计规范
