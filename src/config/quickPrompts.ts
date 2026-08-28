import { ModelType } from '@/types/chat'

export type PromptCategory = 'all' | 'creative' | 'code' | 'analysis' | 'vision' | 'efficiency'

export interface PromptCategoryItem {
  key: PromptCategory
  label: string
}

export const promptCategories: PromptCategoryItem[] = [
  { key: 'all', label: '全部' },
  { key: 'creative', label: '创意写作' },
  { key: 'code', label: '编程开发' },
  { key: 'analysis', label: '逻辑推理' },
  { key: 'vision', label: '视觉图像' },
  { key: 'efficiency', label: '职场效率' }
]

export interface QuickPrompt {
  id: string
  tag: string
  title: string
  description: string
  prompt: string
  category: PromptCategory
  model?: ModelType
  mode: 'chat' | 'image'
}

export const quickPrompts: QuickPrompt[] = [
  // 1. 创意写作
  {
    id: 'xhs-post',
    tag: '爆款文案',
    title: '小红书种草文案',
    description: '吸睛标题与黄金结构化排版',
    prompt: '请为我撰写一篇关于【产品/主题】的小红书爆款种草文案，包含吸引点击的二段式标题、清晰正文分段、恰当的表情排版以及 5 个相关热门标签。',
    category: 'creative',
    mode: 'chat'
  },
  {
    id: 'email-polishing',
    tag: '商务沟通',
    title: '中英文商务邮件润色',
    description: '专业得体，提供双语对照版本',
    prompt: '请帮我以专业、得体、严谨的商务语气润色以下邮件内容，并提供中英文双语对照版本：\n\n【邮件草稿内容】',
    category: 'creative',
    mode: 'chat'
  },
  {
    id: 'naming-slogan',
    tag: '品牌策划',
    title: '产品起名与 Slogan',
    description: '好记好传播的品牌名与核心寓意',
    prompt: '我正在开发一款【产品/服务名称与定位】，请帮我构思 5 个有记忆点、好传播的品牌名称，并为每个名字配一句 Slogan 和核心设计寓意。',
    category: 'creative',
    mode: 'chat'
  },
  {
    id: 'speech-draft',
    tag: '演说文稿',
    title: '主题演讲与发言稿',
    description: '开场抓人、逻辑递进的情感演讲',
    prompt: '请帮我撰写一篇时长约 5 分钟的【活动/会议主题】发言稿，要求开场引人入胜、结构层次清晰，结尾有力量感。',
    category: 'creative',
    mode: 'chat'
  },

  // 2. 编程开发
  {
    id: 'code-review',
    tag: '代码重构',
    title: '代码重构与性能诊断',
    description: '定位异味与潜在内存泄漏缺陷',
    prompt: '请帮我深度审查以下代码，指出性能瓶颈、内存泄漏或逻辑缺陷，并给出重构优化后的版本：\n```\n\n```',
    category: 'code',
    mode: 'chat'
  },
  {
    id: 'sql-query',
    tag: 'SQL 优化',
    title: '复杂 SQL 与索引设计',
    description: '多表联查、窗口函数与执行效率',
    prompt: '我需要编写一条 SQL 来实现以下业务需求，请给出高效的查询语句并提供索引设计建议：\n业务需求：',
    category: 'code',
    mode: 'chat'
  },
  {
    id: 'regex-master',
    tag: '正则匹配',
    title: '正则表达式与用例验证',
    description: '精准规则匹配与捕获组详细解析',
    prompt: '请帮我编写一个严格匹配【目标格式】的正则表达式，详细解释各个符号含义，并列举 5 个正向通过用例与 5 个反向拦截用例。',
    category: 'code',
    mode: 'chat'
  },
  {
    id: 'api-architecture',
    tag: '架构设计',
    title: 'RESTful API 规范设计',
    description: '路由规范、JSON Schema 与错误码',
    prompt: '请帮我设计一套【业务模块】的后端 RESTful API 规范，包含路由路径、请求方法、入参/出参 JSON 结构及常见错误码设计。',
    category: 'code',
    mode: 'chat'
  },
  {
    id: 'ts-type-wizard',
    tag: 'TypeScript',
    title: '高级 TS 类型体操定义',
    description: '泛型约束、条件类型与工具类型',
    prompt: '我需要在 TypeScript 中实现以下高级类型推导，请给出类型定义并附带完整的测试用例：\n需求：',
    category: 'code',
    mode: 'chat'
  },
  {
    id: 'git-expert',
    tag: '版本管理',
    title: 'Git 复杂分支合并与冲突救援',
    description: 'Rebase 变基、Cherry-pick 与历史重写',
    prompt: '我遇到了以下 Git 分支合并/变基冲突场景，请给出安全回滚与正确解决的终端命令步骤：\n场景描述：',
    category: 'code',
    mode: 'chat'
  },

  // 3. 逻辑推理
  {
    id: 'deep-reasoning',
    tag: '深度推导',
    title: '数学证明与逻辑难题推导',
    description: '拆解复杂命题，步步严谨验证',
    prompt: '请启动深度思考推理模式，为我逐步推导并证明以下数学命题或逻辑难题：\n',
    category: 'analysis',
    mode: 'chat'
  },
  {
    id: 'concept-explain',
    tag: '通俗科普',
    title: '用大白话解释前沿概念',
    description: '生动比喻，降低专业理解门槛',
    prompt: '请用生动有趣的日常比喻，向没有专业背景的读者解释清楚【目标科学/技术概念】的核心机制与应用场景。',
    category: 'analysis',
    mode: 'chat'
  },
  {
    id: 'decision-matrix',
    tag: '决策矩阵',
    title: '多方案优劣权衡评估',
    description: '多维度矩阵对比，辅助理性决策',
    prompt: '我正在评估【方案 A】与【方案 B】，请帮我建立一个多维度的决策对比矩阵，从成本、复杂度、扩展性等维度进行客观评分与建议。',
    category: 'analysis',
    mode: 'chat'
  },
  {
    id: 'fallacy-check',
    tag: '批判思维',
    title: '观点论证与逻辑漏洞审查',
    description: '识别偷换概念、幸存者偏差等谬误',
    prompt: '请对以下观点或论证过程进行批判性逻辑审查，指出其中是否存在偷换概念、假两难推理或以偏概全等逻辑漏洞：\n',
    category: 'analysis',
    mode: 'chat'
  },

  // 4. 视觉与图像
  {
    id: 'concept-art',
    tag: '概念插画',
    title: '赛博朋克未来城市插画',
    description: '电影级光影与雨夜全息质感',
    prompt: '生成一张极具未来科技感的赛博朋克城市雨夜插画，霓虹倒影，飞行器穿梭于摩天楼宇之间，8k 超高清细节，电影级光影。',
    category: 'vision',
    model: ModelType.ART,
    mode: 'image'
  },
  {
    id: 'anime-scenery',
    tag: '风景渲染',
    title: '日系治愈风自然风景画',
    description: '蓝天白云、阳光树影与柔和色调',
    prompt: '一幅清新治愈的日系动漫水彩风景插画，蓝天白云，阳光透过树梢洒在安静的夏日电车站台，吉卜力动画画风，温暖柔和。',
    category: 'vision',
    model: ModelType.ART,
    mode: 'image'
  },
  {
    id: 'document-ocr',
    tag: '图表解析',
    title: '识别图片并提取表格数据',
    description: '提取关键数据，转为 Markdown 表格',
    prompt: '请帮我识别并提取上传图片中的所有表格、数据或文字，整理为结构清晰的 Markdown 表格，并指出重点数据项。',
    category: 'vision',
    mode: 'chat'
  },
  {
    id: 'avatar-portrait',
    tag: '头像设计',
    title: '3D 粘土质感立体头像',
    description: '皮克斯风格、柔和漫反射与明快配色',
    prompt: '一个可爱的 3D 粘土风格年轻程序员头像，佩戴眼镜，旁边有一台发光的微型笔记本电脑，柔和工作室光照，明快配色，C4D 渲染。',
    category: 'vision',
    model: ModelType.ART,
    mode: 'image'
  },

  // 5. 职场效率
  {
    id: 'weekly-report',
    tag: '周报生成',
    title: 'STAR 原则工作周报提炼',
    description: '零散事项转为高价值总结汇报',
    prompt: '请根据我本周完成的零散工作事项，使用 STAR 原则（情境、任务、行动、结果）整理出一份条理清晰、重点突出的工作周报与下周规划：\n- ',
    category: 'efficiency',
    mode: 'chat'
  },
  {
    id: 'meeting-minutes',
    tag: '会议纪要',
    title: '会议速记整理为行动决议',
    description: '提炼核心要点、待办与责任人',
    prompt: '请将以下会议讨论内容整理成规范的会议纪要，包含：会议议题、核心共识决议、待办事项（Action Items）及责任人分配：\n\n【会议记录】',
    category: 'efficiency',
    mode: 'chat'
  },
  {
    id: 'swot-analysis',
    tag: '商业分析',
    title: '项目 SWOT 四象限分析',
    description: '优势、劣势、机会与威胁客观洞察',
    prompt: '请为【项目/业务方向】进行全面的 SWOT 分析，分别从内部优势 (Strengths)、劣势 (Weaknesses)、外部机会 (Opportunities)、威胁 (Threats) 给出深刻分析与破局策略。',
    category: 'efficiency',
    mode: 'chat'
  }
]
