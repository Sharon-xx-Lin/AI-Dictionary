# 📚 AI Dictionary (智能多语种视觉学习词典)

> 一个融合趣味新丑主义 (Neo-brutalism) 设计风格、AI 概念视觉生成、3D 翻转卡片与情境化记忆的智能语言学习原型应用。

---

## 🔗 在线原型体验 (Live Prototype)

可以直接点击下方链接立即体验在线原型：

- 🚀 **在线交互原型**: [https://ais-pre-zielxfovdhdlzrq2rtzfrw-470661820727.asia-east1.run.app](https://ais-pre-zielxfovdhdlzrq2rtzfrw-470661820727.asia-east1.run.app)
- 🛠️ **开发者预览版本**: [https://ais-dev-zielxfovdhdlzrq2rtzfrw-470661820727.asia-east1.run.app](https://ais-dev-zielxfovdhdlzrq2rtzfrw-470661820727.asia-east1.run.app)
- 📄 **快速跳转文件**: 本仓库根目录下包含 [`prototype.html`](./prototype.html) 与 [`PROTOTYPE.md`](./PROTOTYPE.md)，双击 `prototype.html` 亦可自动直达原型。

---

## ✨ 核心特性

- 🎯 **AI 智能生词解析**
  - 输入任何单词或短语，AI 自动提取音标、词性、精准释义与语境示例。
  - 自动提供联想记忆技巧（Mnemonic Hooks）与词源分解。
- 🎨 **视觉概念化卡片**
  - 结合 Google Gemini 生成概念图像与自定义矢量绘图，图文结合加深联想记忆。
- 🃏 **3D 交互翻转闪卡 (Study Flashcards)**
  - 卡片正面展示词汇与概念视觉插图，支持真实语音发音试听。
  - 卡片反面呈现地道例句、构词拆解及记忆故事，流畅 3D 翻转动效。
- 📖 **情境故事串联 (Story Generator)**
  - 将近期查询或收藏的多个词汇一键编写成富有趣味的情境短篇故事，在阅读中强化记忆。
- 🏆 **自测与复习检验 (Quiz & Practice)**
  - 提供多题型词汇自测功能，实时检验学习成果。
- ⚡ **鲜明的新丑主义 (Neo-brutalism) UI**
  - 高对比度粗黑边框、醒目的几何配色、趣味阴影与立体感交互。

---

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **样式方案**: Tailwind CSS v4 + 现代 Neo-brutalism 风格体系
- **动效库**: Motion (Framer Motion)
- **图标库**: Lucide React
- **后端支持**: Node.js + Express + Google GenAI SDK (`@google/genai`)
- **构建工具**: Vite 6 + esbuild + tsx

---

## 💻 本地运行指南

### 1. 克隆代码仓库
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制并重命名 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```
在 `.env` 中填入你的 Gemini API Key：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. 启动开发服务器
```bash
npm run dev
```
启动后访问本地开发服务：`http://localhost:3000`

### 5. 构建与生产部署
```bash
npm run build
npm start
```

---

## 📁 目录结构

```text
├── prototype.html         # 浏览器双击直达在线原型的快捷文件
├── PROTOTYPE.md           # 原型访问指引与说明
├── README.md              # 项目说明文档与原型链接
├── package.json           # 项目依赖与运行脚本
├── server.ts              # 后端 Express 代理与 Gemini API 接口服务
├── index.html             # 前端 HTML 入口
└── src/
    ├── App.tsx            # 主应用框架与状态管理
    ├── components/        # 模块化组件（学习卡片、词典搜索、故事生成、测试模式等）
    └── index.css          # 全局样式与 3D 翻转卡片关键类
```

---

欢迎提出反馈与建议！
