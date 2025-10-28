# VitePress 文档完整指南

本文档说明如何使用和完善 `@ldesign/generator` 的 VitePress 文档站点。

## 📁 文档结构

```
docs/
├── .vitepress/
│   └── config.ts           # VitePress 配置文件
├── guide/                   # 指南文档
│   ├── introduction.md      # 介绍
│   ├── getting-started.md   # 快速开始 ✅
│   ├── installation.md      # 安装指南
│   ├── configuration.md     # 配置说明
│   ├── generators.md        # 生成器概念
│   ├── templates.md         # 模板引擎
│   ├── plugins.md           # 插件系统
│   ├── config.md            # 配置系统
│   ├── cli/                 # CLI 命令
│   │   ├── overview.md      # CLI 概述
│   │   ├── component.md     # 组件生成
│   │   ├── page.md          # 页面生成
│   │   ├── batch.md         # 批量生成
│   │   └── history.md       # 历史回滚
│   ├── advanced/            # 高级功能
│   │   ├── logger.md        # 日志系统
│   │   ├── cache.md         # 缓存系统
│   │   ├── performance.md   # 性能监控
│   │   ├── validation.md    # 模板验证
│   │   ├── history.md       # 历史管理
│   │   └── rollback.md      # 回滚功能
│   └── best-practices/      # 最佳实践
│       ├── development.md   # 开发规范
│       ├── team.md          # 团队协作
│       ├── performance.md   # 性能优化
│       └── troubleshooting.md # 故障排除
├── api/                     # API 文档
│   ├── overview.md          # API 概述
│   ├── generator.md         # Generator
│   ├── component-generator.md # ComponentGenerator
│   ├── page-generator.md    # PageGenerator
│   ├── api-generator.md     # ApiGenerator
│   ├── batch-generator.md   # BatchGenerator
│   ├── template-engine.md   # TemplateEngine
│   ├── plugin-system.md     # PluginSystem
│   ├── cache-manager.md     # CacheManager
│   ├── performance-monitor.md # PerformanceMonitor
│   ├── history-manager.md   # HistoryManager
│   ├── rollback-manager.md  # RollbackManager
│   ├── plugin-development.md # 插件开发
│   ├── built-in-plugins.md  # 内置插件
│   └── types.md             # 类型定义
├── examples/                # 示例文档
│   ├── basic.md             # 基础示例
│   ├── vue.md               # Vue 组件
│   ├── react.md             # React 组件
│   ├── angular.md           # Angular 组件
│   ├── batch.md             # 批量生成
│   ├── custom-plugin.md     # 自定义插件
│   ├── workflow.md          # 完整工作流
│   ├── crud.md              # CRUD 系统
│   ├── team-collaboration.md # 团队协作
│   ├── performance-optimization.md # 性能优化
│   └── ci-cd.md             # CI/CD 集成
├── public/                  # 静态资源
│   ├── logo.svg             # Logo
│   └── favicon.ico          # 图标
├── index.md                 # 首页 ✅
├── changelog.md             # 更新日志
└── package.json             # 文档项目配置 ✅
```

## 🚀 快速开始

### 安装依赖

```bash
cd docs
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 `http://localhost:5173` 查看文档站点。

### 构建生产版本

```bash
pnpm build
```

构建后的文件在 `docs/.vitepress/dist` 目录。

### 预览生产版本

```bash
pnpm preview
```

## 📝 已创建的文档

### ✅ 完成

1. **配置文件** (`docs/.vitepress/config.ts`)
   - 完整的侧边栏配置
   - 导航栏配置
   - 主题配置
   - 搜索配置

2. **首页** (`docs/index.md`)
   - Hero 区域
   - 12 个特性卡片
   - 快速上手示例
   - 性能对比表

3. **快速开始** (`docs/guide/getting-started.md`)
   - 安装指南
   - 初始化配置
   - 生成组件示例
   - 生成页面示例
   - 批量生成示例
   - 插件使用
   - 历史回滚

4. **文档项目配置** (`docs/package.json`)
   - VitePress 依赖
   - 开发、构建、预览脚本

## 📋 待创建的文档页面

### 指南部分

#### 基础指南
- [ ] `guide/introduction.md` - 介绍
- [ ] `guide/installation.md` - 安装指南
- [ ] `guide/configuration.md` - 配置说明

#### 核心概念
- [ ] `guide/generators.md` - 生成器
- [ ] `guide/templates.md` - 模板引擎
- [ ] `guide/plugins.md` - 插件系统
- [ ] `guide/config.md` - 配置系统

#### CLI 命令
- [ ] `guide/cli/overview.md` - CLI 概述
- [ ] `guide/cli/component.md` - 组件生成
- [ ] `guide/cli/page.md` - 页面生成
- [ ] `guide/cli/batch.md` - 批量生成
- [ ] `guide/cli/history.md` - 历史回滚

#### 高级功能
- [ ] `guide/advanced/logger.md` - 日志系统
- [ ] `guide/advanced/cache.md` - 缓存系统
- [ ] `guide/advanced/performance.md` - 性能监控
- [ ] `guide/advanced/validation.md` - 模板验证
- [ ] `guide/advanced/history.md` - 历史管理
- [ ] `guide/advanced/rollback.md` - 回滚功能

#### 最佳实践
- [ ] `guide/best-practices/development.md` - 开发规范
- [ ] `guide/best-practices/team.md` - 团队协作
- [ ] `guide/best-practices/performance.md` - 性能优化
- [ ] `guide/best-practices/troubleshooting.md` - 故障排除

### API 部分

- [ ] `api/overview.md` - API 概述
- [ ] `api/generator.md` - Generator
- [ ] `api/component-generator.md` - ComponentGenerator
- [ ] `api/page-generator.md` - PageGenerator
- [ ] `api/api-generator.md` - ApiGenerator
- [ ] `api/batch-generator.md` - BatchGenerator
- [ ] `api/template-engine.md` - TemplateEngine
- [ ] `api/plugin-system.md` - PluginSystem
- [ ] `api/cache-manager.md` - CacheManager
- [ ] `api/performance-monitor.md` - PerformanceMonitor
- [ ] `api/history-manager.md` - HistoryManager
- [ ] `api/rollback-manager.md` - RollbackManager
- [ ] `api/plugin-development.md` - 插件开发
- [ ] `api/built-in-plugins.md` - 内置插件
- [ ] `api/types.md` - 类型定义

### 示例部分

- [ ] `examples/basic.md` - 基础示例
- [ ] `examples/vue.md` - Vue 组件
- [ ] `examples/react.md` - React 组件
- [ ] `examples/angular.md` - Angular 组件
- [ ] `examples/batch.md` - 批量生成
- [ ] `examples/custom-plugin.md` - 自定义插件
- [ ] `examples/workflow.md` - 完整工作流
- [ ] `examples/crud.md` - CRUD 系统
- [ ] `examples/team-collaboration.md` - 团队协作
- [ ] `examples/performance-optimization.md` - 性能优化
- [ ] `examples/ci-cd.md` - CI/CD 集成

### 其他
- [ ] `changelog.md` - 更新日志

## 🎨 文档编写指南

### Markdown 增强功能

VitePress 支持以下 Markdown 增强功能：

#### 1. 代码组

```markdown
::: code-group

\`\`\`bash [pnpm]
pnpm add -D @ldesign/generator
\`\`\`

\`\`\`bash [npm]
npm install -D @ldesign/generator
\`\`\`

:::
```

#### 2. 自定义容器

```markdown
::: tip 提示
这是一个提示容器
:::

::: warning 警告
这是一个警告容器
:::

::: danger 危险
这是一个危险容器
:::

::: details 点击展开
这是详细信息
:::
```

#### 3. 代码高亮

```markdown
\`\`\`typescript{2,4-6}
import { ComponentGenerator } from '@ldesign/generator'

const gen = new ComponentGenerator('./templates', './src')
await gen.generateVueComponent({
  name: 'MyButton'
})
\`\`\`
```

#### 4. 表格

```markdown
| 操作 | v1.0 | v2.0 | 提升 |
|------|------|------|------|
| 单文件生成 | 45ms | 12ms | ⬆️ 73% |
```

#### 5. 徽章

```markdown
<Badge type="tip" text="推荐" />
<Badge type="warning" text="实验性" />
<Badge type="danger" text="废弃" />
```

### 文档模板

#### API 文档模板

```markdown
# ComponentGenerator

组件生成器，用于生成 Vue、React、Angular 组件。

## 构造函数

\`\`\`typescript
new ComponentGenerator(templateDir: string, outputDir: string)
\`\`\`

### 参数

- **templateDir**: 模板目录路径
- **outputDir**: 输出目录路径

## 方法

### generateVueComponent()

生成 Vue 组件。

\`\`\`typescript
async generateVueComponent(options: ComponentOptions): Promise<GenerateResult>
\`\`\`

#### 参数

- **options**: 组件配置选项

#### 返回值

返回 `Promise<GenerateResult>`

#### 示例

\`\`\`typescript
const gen = new ComponentGenerator('./templates', './src')

await gen.generateVueComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string' }
  ]
})
\`\`\`

## 类型定义

\`\`\`typescript
interface ComponentOptions {
  name: string
  props?: Array<{ name: string; type: string }>
  emits?: string[]
  withStyle?: boolean
  styleType?: 'css' | 'scss' | 'less'
}
\`\`\`
```

#### 指南文档模板

```markdown
# 模板引擎

本章介绍 @ldesign/generator 的模板引擎系统。

## 概述

模板引擎支持 EJS 和 Handlebars 两种模板语法...

## 基础用法

### EJS 模板

\`\`\`ejs
<template>
  <div class="<%= kebabCase(componentName) %>">
    <%= componentName %>
  </div>
</template>
\`\`\`

## 助手函数

### 字符串转换

- `pascalCase(str)` - 转换为 PascalCase
- `camelCase(str)` - 转换为 camelCase
- `kebabCase(str)` - 转换为 kebab-case

## 最佳实践

::: tip 建议
使用 kebabCase 用于 CSS 类名
:::

## 相关链接

- [API 文档](/api/template-engine)
- [自定义模板示例](/examples/custom-template)
```

## 🔗 有用的资源

- [VitePress 官方文档](https://vitepress.dev/)
- [VitePress 主题配置](https://vitepress.dev/reference/default-theme-config)
- [Markdown 扩展](https://vitepress.dev/guide/markdown)

## 📦 静态资源

将以下文件放入 `docs/public/` 目录：

- `logo.svg` - 网站 Logo
- `favicon.ico` - 网站图标
- 其他图片资源

## 🌐 部署

### GitHub Pages

在 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Docs

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd docs
          pnpm install
      
      - name: Build
        run: |
          cd docs
          pnpm build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

### Vercel

1. 导入项目到 Vercel
2. 设置构建命令: `cd docs && pnpm build`
3. 设置输出目录: `docs/.vitepress/dist`

### Netlify

创建 `netlify.toml`：

```toml
[build]
  command = "cd docs && pnpm install && pnpm build"
  publish = "docs/.vitepress/dist"
```

## 💡 下一步

1. 安装依赖并启动开发服务器
2. 根据模板创建剩余的文档页面
3. 添加静态资源（Logo、图标等）
4. 配置部署流程
5. 完善文档内容

## 🤝 贡献

欢迎贡献文档！请确保：

- 遵循文档模板格式
- 使用清晰的标题层级
- 提供代码示例
- 添加相关链接
- 使用合适的容器提示

---

**文档版本**: v2.0.0  
**最后更新**: 2025-10-28  
**维护者**: LDesign Team
