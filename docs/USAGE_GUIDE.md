# LDesign Generator 使用指南

## 目录

1. [快速开始](#快速开始)
2. [安装](#安装)
3. [基础使用](#基础使用)
4. [CLI 命令](#cli-命令)
5. [编程 API](#编程-api)
6. [模板系统](#模板系统)
7. [插件开发](#插件开发)
8. [高级功能](#高级功能)
9. [常见场景](#常见场景)
10. [故障排除](#故障排除)

---

## 快速开始

### 1. 安装

```bash
pnpm add -D @ldesign/generator
# 或
npm install -D @ldesign/generator
# 或
yarn add -D @ldesign/generator
```

### 2. 初始化配置

```bash
npx lgen init
```

这会创建 `ldesign.config.js` 配置文件。

### 3. 生成第一个组件

```bash
# 交互式生成
npx lgen component

# 或使用命令行参数
npx lgen c -t vue -n MyButton
```

---

## 安装

### 全局安装

```bash
npm install -g @ldesign/generator
```

安装后可直接使用 `lgen` 命令：

```bash
lgen component -t vue -n MyButton
```

### 项目内安装

```bash
npm install -D @ldesign/generator
```

使用 `npx` 或 npm scripts：

```bash
npx lgen component
```

---

## 基础使用

### CLI 方式

#### 生成组件

```bash
# Vue 组件
lgen c -t vue -n MyButton

# React 组件
lgen c -t react -n MyButton

# 带选项
lgen c -t vue -n MyButton --style-type scss --with-test
```

#### 生成页面

```bash
# CRUD 列表页
lgen p -t vue -n UserList --crud list --with-api --with-store

# 自定义页面
lgen p -t react -n Dashboard
```

#### 生成 Hook/Composable

```bash
# Vue Composable
lgen h -t vue -n useFetch --async

# React Hook
lgen h -t react -n useLocalStorage
```

#### 生成 Store

```bash
# Pinia Store
lgen s -t pinia -n user

# Zustand Store
lgen s -t zustand -n user
```

#### 生成 API

```bash
# RESTful API
lgen a -n user --restful --with-mock

# 自定义 API
lgen a -n custom
```

### 编程 API 方式

```typescript
import { ComponentGenerator } from '@ldesign/generator'

const generator = new ComponentGenerator('./templates', './src/components')

await generator.generateVueComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string', default: 'primary' },
    { name: 'size', type: "'small' | 'medium' | 'large'", default: 'medium' }
  ],
  emits: ['click'],
  withStyle: true,
  withTest: true
})
```

---

## CLI 命令

### 命令列表

| 命令 | 别名 | 描述 |
|------|------|------|
| `component` | `c` | 生成组件 |
| `page` | `p` | 生成页面 |
| `hook` | `h` | 生成 Hook/Composable |
| `store` | `s` | 生成 Store |
| `api` | `a` | 生成 API |
| `init` | - | 初始化配置 |

### 通用选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `-t, --type <type>` | 框架类型 | vue |
| `-n, --name <name>` | 名称 | - |
| `-o, --output <output>` | 输出目录 | 从配置读取 |
| `--no-style` | 不生成样式 | false |
| `--no-test` | 不生成测试 | false |
| `--style-type <type>` | 样式类型 | css |

### 组件特定选项

| 选项 | 描述 |
|------|------|
| `--tsx` | 生成 TSX 组件（Vue） |
| `--class` | 生成类组件（React） |

### 页面特定选项

| 选项 | 描述 |
|------|------|
| `--crud <type>` | CRUD 类型（list/detail/edit/create） |
| `--with-api` | 生成 API 调用 |
| `--with-store` | 生成状态管理 |

### API 特定选项

| 选项 | 描述 |
|------|------|
| `--restful` | 生成 RESTful API |
| `--with-mock` | 生成 Mock 数据 |

---

## 编程 API

### 基础生成

```typescript
import { Generator } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  config: {
    defaultLang: 'ts',
    prettier: true
  }
})

const result = await generator.generate('my-template.ejs', {
  name: 'MyComponent',
  description: '我的组件'
})

if (result.success) {
  console.log('✓ 生成成功:', result.outputPath)
} else {
  console.error('✗ 生成失败:', result.error)
}
```

### 使用插件

```typescript
import { Generator, stylePlugin, testPlugin } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [stylePlugin, testPlugin]
})
```

### 自定义配置

```typescript
const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  config: {
    nameCase: 'pascalCase',
    fileStructure: 'nested',
    defaultLang: 'ts',
    styleType: 'scss',
    testFramework: 'vitest',
    prettier: true
  }
})
```

---

## 模板系统

### 模板语法（EJS）

#### 基础语法

```ejs
<%# 注释 %>
<%= variable %> <%# 转义输出 %>
<%- variable %> <%# 不转义输出 %>
<% code %> <%# JavaScript 代码 %>
```

#### 条件语句

```ejs
<% if (withStyle) { %>
import './style.css'
<% } %>

<% if (lang === 'ts') { %>
interface Props {
  // TypeScript props
}
<% } else { %>
// JavaScript props
<% } %>
```

#### 循环

```ejs
<% props.forEach(prop => { %>
  <%= prop.name %>: <%= prop.type %>
<% }) %>
```

#### 辅助函数

```ejs
<%= pascalCase(componentName) %>
<%= kebabCase(componentName) %>
<%= camelCase(componentName) %>
<%= upperCase(componentName) %>
<%= currentYear() %>
<%= currentDate() %>
```

### 模板示例

#### Vue 组件模板

```ejs
<template>
  <div class="<%= kebabCase(componentName) %>">
    <h1><%= componentName %></h1>
    <%  if (description) { %>
    <p><%= description %></p>
    <% } %>
  </div>
</template>

<script setup lang="<%= lang %>">
<% if (props.length > 0) { %>
interface Props {
  <% props.forEach(prop => { %>
  <%= prop.name %>: <%= prop.type %>
  <% }) %>
}

const props = defineProps<Props>()
<% } %>

<% if (emits.length > 0) { %>
const emit = defineEmits<<%= emits.map(e => `'${e}'`).join(' | ') %>>()
<% } %>
</script>

<% if (withStyle) { %>
<style scoped lang="<%= styleType %>">
.<%= kebabCase(componentName) %> {
  /* 样式 */
}
</style>
<% } %>
```

---

## 插件开发

### 创建插件

```typescript
import { definePlugin } from '@ldesign/generator'

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',
  
  config: {
    // 插件配置
    someOption: true
  },
  
  hooks: {
    beforeGenerate: async (context) => {
      console.log('即将生成:', context.templateName)
      
      // 可以验证或修改 context
      if (!context.data.name) {
        throw new Error('缺少 name 字段')
      }
    },
    
    afterGenerate: async (context, result) => {
      if (result.success) {
        console.log('生成完成:', result.outputPath)
        
        // 可以执行额外操作，如格式化、Git 提交等
      }
    },
    
    onTemplateRender: async (context, content) => {
      // 修改渲染后的内容
      return content
        .replace(/TODO/g, 'FIXME')
        .replace(/author: unknown/g, `author: ${process.env.USER}`)
    },
    
    onError: async (context, error) => {
      // 错误处理
      console.error('生成失败:', error.message)
      
      // 可以发送通知、记录日志等
    }
  }
})

export default myPlugin
```

### 使用自定义插件

```typescript
import { Generator } from '@ldesign/generator'
import myPlugin from './my-plugin'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [myPlugin]
})
```

---

## 高级功能

### 干运行模式

```typescript
import { DryRunGenerator } from '@ldesign/generator'

const dryGen = new DryRunGenerator(options)
const result = await dryGen.dryRunGenerate('template.ejs', data)

DryRunGenerator.displayResult(result, {
  showContent: true,
  maxContentLength: 500
})

// 确认后实际生成
if (confirm) {
  await generator.generate('template.ejs', data)
}
```

### 预览生成结果

```typescript
import { PreviewGenerator } from '@ldesign/generator'

const previewGen = new PreviewGenerator(options)
const result = await previewGen.generatePreview('template.ejs', data, {
  showLineNumbers: true,
  showDiff: true,
  interactive: true
})

if (result.approved) {
  await generator.generate('template.ejs', data)
}
```

### 批量生成

```typescript
import { BatchGenerator } from '@ldesign/generator'

const batchGen = new BatchGenerator(options)

// 从 JSON 文件加载配置
const configs = await batchGen.loadConfigFromFile('./batch-config.json')

// 并行生成
const result = await batchGen.generateBatch(configs, {
  parallel: true,
  maxConcurrency: 10,
  continueOnError: true,
  showProgress: true
})

BatchGenerator.displayResult(result)
```

### 回滚操作

```typescript
import { rollbackManager, historyManager } from '@ldesign/generator'

// 查看历史
const recent = historyManager.getRecent(10)

// 回滚最近的操作
await rollbackManager.rollbackLast({
  backup: true,
  interactive: true
})

// 回滚特定操作
await rollbackManager.rollback('history-id')
```

---

## 常见场景

### 场景1: 快速创建组件

```bash
lgen c -t vue -n MyButton --style-type scss
```

### 场景2: 创建完整的 CRUD 页面

```typescript
import { PageGenerator } from '@ldesign/generator'

const generator = new PageGenerator('./templates', './src/pages')

await generator.generateCrudPages({
  name: 'User',
  type: 'vue',
  withApi: true,
  withStore: true
})
```

这将生成 4 个页面：
- UserList (列表页)
- UserDetail (详情页)
- UserEdit (编辑页)
- UserCreate (创建页)

### 场景3: 批量生成多个组件

```typescript
const batchGen = new BatchGenerator(options)

await batchGen.generateBatch([
  { name: 'Button', template: 'vue/component.ejs', data: { componentName: 'Button' } },
  { name: 'Input', template: 'vue/component.ejs', data: { componentName: 'Input' } },
  { name: 'Select', template: 'vue/component.ejs', data: { componentName: 'Select' } }
], {
  parallel: true,
  maxConcurrency: 3
})
```

### 场景4: 生成 RESTful API

```typescript
import { ApiGenerator } from '@ldesign/generator'

const apiGen = new ApiGenerator('./templates', './src/api')

await apiGen.generateRestfulApi({
  name: 'user',
  resource: 'users',
  withMock: true
})
```

### 场景5: 自定义模板

1. 创建模板文件 `my-template.ejs`:

```ejs
/**
 * <%= componentName %> Component
 * <%= description %>
 */

export const <%= pascalCase(componentName) %> = () => {
  return (
    <div className="<%= kebabCase(componentName) %>">
      <h1><%= componentName %></h1>
    </div>
  )
}
```

2. 使用模板：

```typescript
await generator.generate('my-template.ejs', {
  componentName: 'MyComponent',
  description: '我的自定义组件'
})
```

### 场景6: 使用插件

```typescript
import { Generator, stylePlugin, testPlugin, typescriptPlugin } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [stylePlugin, testPlugin, typescriptPlugin]
})

await generator.generate('vue/component.ejs', {
  componentName: 'MyButton',
  withStyle: true,
  withTest: true,
  withTypes: true
})
```

这会自动生成：
- MyButton.vue （组件）
- MyButton.scss （样式，由 stylePlugin 生成）
- MyButton.spec.ts （测试，由 testPlugin 生成）
- MyButton.types.ts （类型，由 typescriptPlugin 生成）

---

## 故障排除

### 问题: 模板未找到

**症状**: `TemplateError: 模板未找到`

**解决**:
1. 检查模板路径是否正确
2. 检查模板文件扩展名（.ejs 或 .hbs）
3. 确认 templateDir 配置正确

### 问题: 文件已存在

**症状**: `FileSystemError: 文件已存在`

**解决**:
1. 使用不同的文件名
2. 使用 `--force` 选项覆盖（CLI）
3. 在生成前备份现有文件

### 问题: 路径遍历错误

**症状**: `FileSystemError: 检测到路径遍历攻击尝试`

**解决**:
1. 不要在路径中使用 `..`
2. 使用相对路径而非绝对路径
3. 确保路径在允许的目录内

### 问题: 验证失败

**症状**: `ValidationError: 组件名称验证失败`

**解决**:
1. 使用 PascalCase 或 kebab-case 格式
2. 不要以数字开头
3. 长度在 2-50 字符之间

### 问题: 性能慢

**解决**:
1. 启用缓存: `await engine.warmupCache(templates)`
2. 使用批量生成: `await batchGen.generateBatch(..., { parallel: true })`
3. 增加并发数: `batchGen.setMaxConcurrent(10)`

---

## 最佳实践

1. **使用配置文件**: 创建 `ldesign.config.js` 统一配置
2. **启用缓存**: 预热常用模板，提升性能
3. **使用插件**: 利用插件自动化重复任务
4. **验证输入**: 始终验证用户输入
5. **错误处理**: 捕获并正确处理错误
6. **批量操作**: 使用批量生成提升效率
7. **版本控制**: 将生成的文件加入 Git
8. **测试**: 为生成的代码编写测试
9. **文档**: 为自定义模板添加文档
10. **持续优化**: 定期review和优化模板

---

## 下一步

- 查看 [API 文档](./API.md) 了解详细API
- 查看 [最佳实践](./BEST_PRACTICES.md) 学习高级技巧
- 查看 [示例代码](../examples/) 获取灵感
- 参与 [社区讨论](https://github.com/ldesign/generator/discussions)

---

## 获取帮助

- 📖 [完整文档](https://ldesign.dev/generator)
- 💬 [GitHub Discussions](https://github.com/ldesign/generator/discussions)
- 🐛 [报告问题](https://github.com/ldesign/generator/issues)
- 💡 [功能建议](https://github.com/ldesign/generator/issues/new?template=feature_request.md)


