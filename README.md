# 问流 AI (WenFlow) - 多模型全能聚合工作台

基于 **Vue 3 + TypeScript + Vite 6 + Tailwind CSS v4 + Element Plus** 构建的现代化 AI 聚合工作台与批处理中心，支持全量官方大模型矩阵、多模态解析、深度思考推理链、艺术图像生成以及离线大规模批处理。

---

## 🌟 核心功能特性

### 1. 深度思考与流式推理 (Deep Reasoning & Streaming)
- **DeepSeek-R1 深度思考**：支持 `<details>` 沉浸式思考过程折叠渲染与动态思维链。
- **KaTeX 数学公式支持**：完整支持行内公式 `$E=mc^2$` 与块级公式 `$$\sum_{i=1}^n x_i$$`，为数理逻辑推理提供官方级排版体验。
- **实时性能指标**：即时统计单次回复的 Token 生成总量与 Token/s 吞吐速率。
- **智能上下文保护**：内置长会话滑动窗口（保留 System 设定与最近 20 轮对话），有效防止超长会话溢出 Token 限制。

### 2. 双 API 智能路由引擎
- **DeepSeek 官方通道直连**：配置 DeepSeek 官方 API Key 时，自动直连官方开放平台 (`https://api.deepseek.com/v1`)。
- **硅基流动 (SiliconFlow) 模型列表**：通过 API Key 从 `/v1/models` 拉取当前账户实际可用的模型端点；本地列表只作为无网络时的选择界面，不代表端点一定在线。

### 3. 多模态与图像工坊 (Multimodal & Art Studio)
- **多模态图文解析**：仅对已登记且在线的视觉模型发送 OpenAI 兼容的 `image_url` 内容。PDF、音频、视频不会伪装成聊天接口可解析的输入。
- **AI 艺术创作**：集成可图 (Kolors)、FLUX、Stable Diffusion 3.5 等文生图与图生图引擎，支持尺寸切换、负向提示词、参考图与骨架屏生成。

### 4. 批处理与云端数据中心 (Batch & File Center)
- **50% 算力折扣批处理**：支持大规模离线异步推理任务提交与状态轮询。
- **云端数据管理**：提供 JSONL 规范模板生成、云端文件上传与结果回传下载。

### 5. 全屏官方模型广场 (Model Square)
- 支持实时同步当前账户可用端点；只有同步返回的模型才被视为在线可选。

---

## 🛠️ 技术栈

- **核心框架**：Vue 3 (Composition API, `<script setup>`)
- **语言支持**：TypeScript (~5.7)
- **构建工具**：Vite 6
- **UI & 样式**：Tailwind CSS v4 + Element Plus
- **公式排版**：KaTeX + Markdown-it + Highlight.js
- **状态管理**：Pinia + 本地安全持久化
- **路由管理**：Vue Router 4

---

## 🚀 快速上手

### 1. 安装依赖
```bash
pnpm install
```

### 2. 环境配置
复制 `.env.example` 并重命名为 `.env`，填入您的 API Key：
```env
# 硅基流动 API Key (支持全系列模型)
VITE_SILICONFLOW_API_KEY=your_siliconflow_api_key_here

# DeepSeek 官方 API Key (可选备用直连)
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```
> 也可在网页左下角【设置】面板中直接输入并即时保存/测试 Key。

### 3. 本地启动
```bash
pnpm dev
```

### 4. 类型检查与生产构建
```bash
pnpm type-check
pnpm build
```

---

## 📁 目录结构

```
src/
├── assets/          # 静态资源与全局样式 (Tailwind v4 tokens)
├── components/      # UI 组件
│   ├── batch/       # 批处理中心抽屉 (BatchCenterDrawer.vue)
│   ├── chat/        # 对话容器与输入框 (ChatContainer, ChatInput, MessageBubble, ChatSidebar)
│   └── models/      # 模型广场弹窗 (ModelSquareModal.vue)
├── router/          # 页面路由配置
├── services/        # API 业务服务
│   ├── aiService.ts       # 对话流式服务与智能双通道路由
│   ├── batchService.ts    # 硅基流动 Batch 与 File 接口
│   ├── imageService.ts    # 文生图/图生图服务
│   └── modelsService.ts   # 官方模型矩阵与云端同步
├── stores/          # Pinia 状态管理 (chatStore, configStore)
├── types/           # 全局 TypeScript 类型定义 (chat.ts, image.ts)
└── views/           # 页面视图 (HomeView, ChatView)
```

---

## 📄 开源许可证

本项目基于 MIT 许可证开源。
