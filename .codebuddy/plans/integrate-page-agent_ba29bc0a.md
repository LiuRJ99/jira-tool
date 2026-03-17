---
name: integrate-page-agent
overview: 在 JIRA 工具中集成 Alibaba Page Agent，使用户可以通过自然语言与 JIRA 工单查询页面交互
design:
  architecture:
    framework: vue
  styleKeywords:
    - Minimalism
    - Glassmorphism
    - Gradient
    - Micro-interactions
  fontSystem:
    fontFamily: PingFang-SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#1890FF"
      - "#40A9FF"
      - "#096DD9"
    background:
      - "#FFFFFF"
      - "#F5F5F5"
      - "#FAFAFA"
    text:
      - "#262626"
      - "#595959"
      - "#8C8C8C"
    functional:
      - "#52C41A"
      - "#FF4D4F"
      - "#FAAD14"
todos:
  - id: install-page-agent
    content: 安装 @alipage/page-agent SDK 及相关依赖
    status: completed
  - id: create-types
    content: 创建 Page Agent 类型定义文件 (src/types/pageAgent.ts)
    status: completed
  - id: create-store
    content: 创建 Page Agent 配置 store (src/stores/pageAgent.ts)
    status: completed
    dependencies:
      - create-types
  - id: create-actions
    content: 创建 Actions 注册模块 (src/pageAgent/actions.ts)
    status: completed
    dependencies:
      - create-types
  - id: create-context
    content: 创建上下文同步模块 (src/pageAgent/context.ts)
    status: completed
    dependencies:
      - create-store
  - id: create-widget
    content: 创建 Page Agent 悬浮组件 (src/pageAgent/components/PageAgentWidget.vue)
    status: completed
    dependencies:
      - create-actions
      - create-context
  - id: modify-config-view
    content: 在 ConfigView 添加 LLM 配置表单
    status: completed
    dependencies:
      - create-store
  - id: modify-home-view
    content: 在 HomeView 集成 Page Agent 组件并注册 Actions
    status: completed
    dependencies:
      - create-widget
  - id: create-init-entry
    content: 创建 Page Agent 初始化入口 (src/pageAgent/index.ts)
    status: completed
    dependencies:
      - create-store
      - create-actions
  - id: modify-main
    content: 在 main.ts 初始化 Page Agent
    status: completed
    dependencies:
      - create-init-entry
---

## 产品概述

在现有 JIRA 管理工具中集成 Alibaba Page Agent 功能，让用户可以通过自然语言与 JIRA 工具进行交互。

## 核心功能

1. **AI 对话助手** - 页面右下角悬浮聊天窗口，用户可以用自然语言描述需求
2. **智能操作执行** - Page Agent 理解用户意图后自动调用页面功能
3. **人机协同确认** - AI 执行关键操作前需要用户确认
4. **支持的交互指令**：

- 查询指定 JIRA 工单（"查询 PROJ-123 和 PROJ-456"）
- 按作者筛选（"只显示张三的评论"）
- 按关键字筛选（"筛选包含'测试'的备注"）
- 复制审批内容（"复制 A 审批内容"）
- 清空结果（"清空查询结果"）
- 获取待审批列表（"获取待审批工单"）

## 技术约束

- 基于现有 Vue 3 + TypeScript + Vite 项目架构
- Page Agent 在浏览器内运行，数据完全由用户掌控
- 支持用户配置自己的 LLM API Key（OpenAI、Claude、DeepSeek、Qwen 等）

## Tech Stack Selection

### 现有技术栈

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Router**: Vue Router
- **HTTP Client**: Axios

### 新增技术

- **Page Agent SDK**: `@alipage/page-agent` 或 CDN 引入方式
- **LLM Integration**: 支持 OpenAI / Claude / DeepSeek / Qwen 等 API

## Implementation Approach

### 集成策略

Page Agent 采用零基建集成方式，通过 script 标签或 npm 包引入。核心机制：

1. **注册 Actions** - 将页面可执行操作暴露给 Page Agent
2. **上下文注入** - 向 Agent 提供当前页面状态（工单列表、筛选条件等）
3. **LLM 配置** - 用户在配置页设置自己的 API Key 和模型选择

### 关键设计决策

1. **初始化位置**: 在 `main.ts` 中全局初始化 Page Agent，确保所有页面可用
2. **Actions 定义**: 创建 `pageAgent/actions.ts` 封装所有可执行操作
3. **上下文管理**: 通过 Pinia store 实时同步页面状态到 Agent
4. **配置存储**: LLM 配置与 JIRA 配置分开存储，使用独立 localStorage key

### 性能考虑

- Page Agent 采用懒加载，只在用户点击悬浮按钮时加载 LLM 对话组件
- Actions 执行保持异步，避免阻塞页面渲染
- 上下文更新采用防抖策略，减少不必要的重渲染

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     JIRA Tool (Vue 3)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  HomeView    │  │  ConfigView  │  │ Page Agent   │      │
│  │  (Query UI)  │  │  (+ LLM cfg) │  │  (Chat UI)   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                    │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Jira Store  │  │  PageAgent   │  │  Actions     │      │
│  │  (Pinia)     │◄─┤  Context     │◄─┤  Registry    │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                    │
│  ┌──────▼───────┐  ┌──────────────┐                        │
│  │Jira Service  │  │  LLM API     │                        │
│  │ (Axios)      │  │ (User Config)│                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Module Division

- **PageAgent Core**: SDK 初始化、配置管理、LLM 连接
- **Actions Module**: 定义可执行操作（查询、筛选、复制等）
- **Context Module**: 页面状态同步到 Agent
- **UI Components**: 悬浮按钮、聊天窗口、配置表单

## Directory Structure

```
src/
├── pageAgent/
│   ├── index.ts           # [NEW] Page Agent 初始化入口
│   ├── actions.ts         # [NEW] 定义可执行操作
│   ├── context.ts         # [NEW] 页面上下文管理
│   ├── types.ts           # [NEW] TypeScript 类型定义
│   └── components/
│       └── PageAgentWidget.vue  # [NEW] Agent 悬浮组件
├── stores/
│   ├── jira.ts            # [EXISTING] 扩展：添加 Page Agent 配置
│   └── pageAgent.ts       # [NEW] Page Agent 独立配置 store
├── views/
│   ├── HomeView.vue       # [MODIFY] 注册 Actions 和上下文
│   └── ConfigView.vue     # [MODIFY] 添加 LLM 配置表单
├── services/
│   └── pageAgent.service.ts  # [NEW] Page Agent 服务封装
└── types/
    └── pageAgent.ts       # [NEW] 类型定义

index.html                 # [MODIFY] 添加 Page Agent script 或保持纯 npm
package.json               # [MODIFY] 添加 page-agent 依赖
.env.example               # [NEW] LLM 配置示例
```

## Implementation Notes

- **CDN vs NPM**: 优先使用 npm 安装 `@alipage/page-agent`，便于版本管理和 TypeScript 支持
- **API Key 安全**: 用户 API Key 仅存储在本地 localStorage，不传输到任何服务器
- **Actions 设计**: 每个 action 需要包含 `name`, `description`, `parameters`, `execute` 方法，便于 LLM 理解调用
- **错误处理**: Agent 执行失败时向用户展示友好错误信息，并提供重试机制
- **上下文同步**: 监听 Pinia store 变化，自动更新 Agent 上下文，保持状态同步

Page Agent 的 UI 采用轻量级悬浮式设计，不干扰原有 JIRA 工具的使用体验。

### 设计架构

- **悬浮入口**: 右下角圆形悬浮按钮，带 AI 图标和微动效
- **聊天面板**: 点击后展开抽屉式聊天窗口，支持拖拽调整大小
- **消息样式**: 区分用户消息（右侧蓝色气泡）和 AI 消息（左侧白色气泡）
- **操作确认**: 关键操作显示确认卡片，包含操作描述和执行/取消按钮
- **加载状态**: AI 思考时显示打字机动效

### 设计内容描述

#### Page Agent 悬浮按钮

- 位置：页面右下角固定定位，距离边缘 24px
- 样式：圆形按钮，直径 56px，主色渐变背景
- 图标：AI/机器人 SVG 图标，白色
- 动效：hover 时轻微放大（1.1x），脉冲光环动画

#### 聊天面板

- 尺寸：默认 380px × 500px，可拖拽调整
- 位置：悬浮按钮左上方展开
- 头部：标题栏显示 "JIRA 助手"，关闭按钮
- 消息区：滚动消息列表，支持 Markdown 渲染
- 输入区：底部多行输入框，发送按钮

#### 确认对话框

- 当 AI 需要执行操作时，显示确认卡片
- 包含操作名称、参数摘要、确认/取消按钮
- 3 秒倒计时自动确认（可选）

### 响应式设计

- 移动端：聊天面板全屏显示，悬浮按钮位置调整避免遮挡关键操作
- 平板/桌面：保持抽屉式面板