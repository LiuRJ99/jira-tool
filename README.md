# JIRA管理工具

这是一个基于Vue.js的JIRA管理工具，用于批量获取JIRA工单的备注和描述信息。

## 功能特点

1. **配置化登录**
   - 支持配置JIRA地址、账号和密码
   - 配置信息保存在本地，无需重复输入

2. **批量获取JIRA信息**
   - 输入多个JIRA工单号（以逗号或空格分隔）
   - 使用代理服务器调用JIRA API获取数据，避免CORS问题
   - 自动提取关键备注信息
   - 支持结果缓存，提高查询效率

3. **信息展示与筛选**
   - 以表格形式展示JIRA工单信息
   - 表格列包括：JIRA号、经办人、测试备注、复核备注、同意备注、验证备注
   - 支持按照作者和关键字筛选备注
   - 评论显示作者颜色标识，便于区分
   - 超过7天的评论会显示日期和警告标识
   - 描述信息可点击跳转至JIRA详情页面

4. **审批流程支持**
   - 支持一键获取待审批工单列表
   - 支持多级审批流程管理
   - 自动复制审批内容到剪贴板

## 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用说明

1. 首次使用需在登录页面配置JIRA服务器信息
2. 配置完成后，输入需要查询的JIRA工单号（多个工单号用逗号分隔）
3. 点击"查询"按钮获取工单信息
4. 系统会自动提取包含关键字的备注信息并展示在表格中
5. 点击描述单元格可跳转至JIRA详情页面

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Pinia
- Axios (用于JIRA API调用)

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 通用组件
├── router/        # 路由配置
├── stores/        # 状态管理
├── services/      # 服务层（API调用）
├── types/         # TypeScript类型定义
└── views/         # 页面组件
```

## 贡献指南

欢迎提交问题和改进建议！

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
