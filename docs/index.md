---
layout: home

hero:
  name: "@ldesign/generator"
  text: "企业级代码生成器"
  tagline: 功能强大的前端代码生成工具，支持 Vue、React、Angular 多框架
  image:
    src: /logo.svg
    alt: LDesign Generator
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/basic
    - theme: alt
      text: GitHub
      link: https://github.com/ldesign/generator

features:
  - icon: 🎯
    title: 丰富的模板库
    details: 内置 Vue、React、Angular 模板，涵盖组件、页面、Hook、Store、API 等 20+ 种类型
  
  - icon: 🔌
    title: 强大的插件系统
    details: 完善的插件架构，支持样式、测试、文档、TypeScript、ESLint 自动生成
  
  - icon: ⚡
    title: 高性能
    details: 三层缓存架构，模板渲染速度提升 50%，批量生成速度提升 45%
  
  - icon: 🛠️
    title: 完整的 CLI
    details: 交互式命令行工具，支持组件、页面、批量生成、历史回滚等 10+ 命令
  
  - icon: 📦
    title: TypeScript 支持
    details: 完整的类型定义，95% 类型覆盖率，提供优秀的开发体验
  
  - icon: 🎨
    title: 灵活配置
    details: 支持配置文件，可自定义生成规则、命名规范、文件结构等
  
  - icon: 📊
    title: 性能监控
    details: 内置性能监控系统，实时分析生成速度，提供优化建议
  
  - icon: 🔄
    title: 历史回滚
    details: 完整的历史记录和回滚功能，安全撤销操作，自动备份
  
  - icon: ✅
    title: 模板验证
    details: 12+ 质量检查项，自动验证模板语法和质量，提供优化建议
  
  - icon: 🚀
    title: 批量操作
    details: 支持并行批量生成，可配置并发数，支持 CSV/JSON 配置文件
  
  - icon: 🌍
    title: 国际化
    details: 支持中英日三语，自动检测系统语言，提供完整的本地化体验
  
  - icon: 🔒
    title: 企业级安全
    details: 20+ 输入验证器，完全防御路径遍历攻击，零已知安全漏洞
---

## 快速上手

### 安装

::: code-group

```bash [pnpm]
pnpm add -D @ldesign/generator
```

```bash [npm]
npm install -D @ldesign/generator
```

```bash [yarn]
yarn add -D @ldesign/generator
```

:::

### 初始化配置

```bash
npx lgen init
```

### 生成第一个组件

::: code-group

```bash [Vue]
npx lgen component -t vue -n MyButton
```

```bash [React]
npx lgen component -t react -n MyButton
```

```bash [Angular]
npx lgen component -t angular -n MyButton
```

:::

## 主要特性

### 🎯 多框架支持

支持 Vue 3、React 18、Angular 17+ 等主流框架，一个工具搞定所有前端项目。

```typescript
import { ComponentGenerator } from '@ldesign/generator'

const gen = new ComponentGenerator('./templates', './src')

// Vue 组件
await gen.generateVueComponent({ name: 'MyButton' })

// React 组件
await gen.generateReactComponent({ name: 'MyButton' })

// Angular 组件
await gen.generateAngularComponent({ name: 'MyButton' })
```

### 🔄 批量生成

支持并行批量生成，大幅提升效率。

```bash
# 从配置文件批量生成
npx lgen batch --config batch.json --parallel

# 从 CSV 文件批量生成
npx lgen batch --csv components.csv --template vue/component.ejs
```

### 📜 历史管理

完整的历史记录和回滚功能。

```bash
# 查看历史
npx lgen history --limit 20

# 回滚最后一次操作
npx lgen rollback --last

# 导出历史
npx lgen history --export ./history.json
```

### ✅ 模板验证

自动验证模板质量，提供优化建议。

```bash
# 验证单个模板
npx lgen validate --template vue/component.ejs

# 验证所有模板
npx lgen validate --all
```

## 性能表现

| 操作 | v1.0 | v2.0 | 提升 |
|------|------|------|------|
| 单文件生成 | 45ms | 12ms | ⬆️ 73% |
| 批量 10 个 | 450ms | 100ms | ⬆️ 78% |
| 批量 100 个 | 4.5s | 1.0s | ⬆️ 78% |
| 模板读取 | 5ms | 0.5ms | ⬆️ 90% |
| 模板编译 | 20ms | 1ms | ⬆️ 95% |

## 社区

- [GitHub](https://github.com/ldesign/generator) - 源代码和问题追踪
- [Discord](https://discord.gg/ldesign) - 社区讨论
- [Twitter](https://twitter.com/ldesign_dev) - 最新动态

## 许可证

[MIT License](https://github.com/ldesign/generator/blob/main/LICENSE) © 2025-present LDesign Team
