# 🎯 Generator 功能特性清单

## 核心功能

### 1. 插件系统 🔌
强大的插件架构，支持自定义扩展和生命周期管理。

**特性：**
- ✅ 插件注册与加载
- ✅ 生命周期钩子（beforeGenerate、afterGenerate、onError、onTemplateRender）
- ✅ 插件配置管理
- ✅ 插件统计和监控

**示例：**
```typescript
import { definePlugin } from '@ldesign/generator'

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  hooks: {
    beforeGenerate: async (context) => {
      console.log('生成前执行')
    }
  }
})
```

### 2. 模板引擎 🎨
支持 EJS 和 Handlebars 双引擎，内置丰富的助手函数。

**特性：**
- ✅ EJS 模板支持
- ✅ Handlebars 模板支持
- ✅ 动态模板注册
- ✅ 12+ 内置助手函数
- ✅ 模板元数据管理

**助手函数：**
- 字符串转换：`pascalCase`、`camelCase`、`kebabCase`、`snakeCase`
- 条件判断：`eq`、`ne`、`gt`、`lt`
- 数组操作：`join`、`length`
- 日期函数：`currentYear`、`currentDate`

### 3. 配置系统 ⚙️
灵活的配置管理，支持多种格式和自动发现。

**特性：**
- ✅ 多格式支持（.js、.ts、.json）
- ✅ 自动配置发现
- ✅ 配置合并和验证
- ✅ 配置缓存

**配置示例：**
```javascript
// ldesign.config.js
export default {
  defaultLang: 'ts',
  styleType: 'scss',
  testFramework: 'vitest',
  prettier: true,
  plugins: []
}
```

## 模板库

### Vue 模板（7个） 📦
全面的 Vue 3 生态系统支持。

| 模板 | 描述 | 文件 |
|------|------|------|
| Component | Vue 3 组件（Composition API） | `vue/component.ejs` |
| TSX Component | Vue TSX 组件 | `vue/component-tsx.ejs` |
| Page | 完整页面模板 | `vue/page.ejs` |
| Composable | Vue Composables | `vue/composable.ejs` |
| Store | Pinia Store 模块 | `vue/store.ejs` |
| Directive | 自定义指令 | `vue/directive.ejs` |
| Plugin | Vue 插件 | `vue/plugin.ejs` |

**支持特性：**
- ✅ Composition API
- ✅ TSX 支持
- ✅ Props 和 Emits
- ✅ 样式 scoped
- ✅ TypeScript 支持
- ✅ Pinia 状态管理

### React 模板（7个） ⚛️
完整的 React 生态系统覆盖。

| 模板 | 描述 | 文件 |
|------|------|------|
| Component | 函数式组件 | `react/component.ejs` |
| Class Component | 类组件 | `react/component-class.ejs` |
| Page | 页面组件 | `react/page.ejs` |
| Hook | 自定义 Hooks | `react/hook.ejs` |
| Context | Context Provider | `react/context.ejs` |
| HOC | 高阶组件 | `react/hoc.ejs` |
| Store | Redux/Zustand Store | `react/store.ejs` |

**支持特性：**
- ✅ 函数组件和类组件
- ✅ Hooks API
- ✅ Context API
- ✅ TypeScript 支持
- ✅ Redux/Zustand 状态管理
- ✅ React Router 集成

### 通用模板（6个） 🔧
跨框架的通用代码模板。

| 模板 | 描述 | 文件 |
|------|------|------|
| API | API 请求模块 | `common/api.ejs` |
| Types | TypeScript 类型定义 | `common/types.ejs` |
| Utils | 工具函数库 | `common/utils.ejs` |
| Config | 配置文件 | `common/config.ejs` |
| Test | 测试文件 | `common/test.ejs` |
| Mock | Mock 数据 | `common/mock.ejs` |

**支持特性：**
- ✅ RESTful API 生成
- ✅ 完整的类型定义
- ✅ 常用工具函数
- ✅ Vitest/Jest 测试
- ✅ Mock 数据生成

## 生成器

### ComponentGenerator 组件生成器
最全面的组件生成工具。

**Vue 方法（6个）：**
- `generateVueComponent()` - 基础组件
- `generateVueTsxComponent()` - TSX 组件
- `generateVueComposable()` - Composable
- `generateVueStore()` - Pinia Store
- `generateVueDirective()` - 自定义指令
- `generateVuePlugin()` - Vue 插件

**React 方法（6个）：**
- `generateReactComponent()` - 函数组件
- `generateReactClassComponent()` - 类组件
- `generateReactHook()` - 自定义 Hook
- `generateReactContext()` - Context Provider
- `generateReactHOC()` - 高阶组件
- `generateReactStore()` - Redux/Zustand Store

### PageGenerator 页面生成器
快速生成完整页面和 CRUD 系统。

**方法：**
- `generateVuePage()` - Vue 页面
- `generateReactPage()` - React 页面
- `generateCrudPages()` - 完整 CRUD（4个页面）

**CRUD 类型：**
- ✅ List - 列表页
- ✅ Detail - 详情页
- ✅ Edit - 编辑页
- ✅ Create - 创建页

### ApiGenerator API 生成器
自动化 API 代码生成。

**方法：**
- `generateApi()` - 自定义 API
- `generateRestfulApi()` - RESTful API

**功能：**
- ✅ 自动生成 CRUD 端点
- ✅ TypeScript 类型定义
- ✅ Mock 数据生成
- ✅ Axios 拦截器
- ✅ 错误处理

## 内置插件

### stylePlugin 样式插件 💅
自动生成样式文件。

**支持：**
- ✅ CSS
- ✅ SCSS
- ✅ Less
- ✅ Stylus
- ✅ CSS Modules
- ✅ Tailwind CSS

### testPlugin 测试插件 🧪
自动生成测试文件。

**支持：**
- ✅ Vitest
- ✅ Jest
- ✅ Vue Test Utils
- ✅ React Testing Library
- ✅ 组件测试
- ✅ Hook 测试
- ✅ API 测试

### docPlugin 文档插件 📚
自动生成文档和示例。

**功能：**
- ✅ Markdown 文档
- ✅ Storybook 文档
- ✅ Props 表格
- ✅ 代码示例
- ✅ 使用说明

## CLI 命令

### 命令列表
```bash
lgen component  # 或 lgen c
lgen page       # 或 lgen p
lgen hook       # 或 lgen h
lgen store      # 或 lgen s
lgen api        # 或 lgen a
lgen init       # 初始化配置
```

### 交互式模式 🎮
所有命令都支持交互式输入，无需记忆复杂参数。

**特性：**
- ✅ 智能提示
- ✅ 输入验证
- ✅ 默认值
- ✅ 多选框
- ✅ 美观输出

### 命令选项
```bash
# 组件
lgen c -t vue -n MyButton --tsx --style-type scss

# 页面
lgen p -t react -n UserList --crud list --with-api --with-store

# Hook
lgen h -t vue -n useFetch --async

# Store
lgen s -t pinia -n user

# API
lgen a -n user --restful --with-mock
```

## API 使用

### 基础用法
```typescript
import { ComponentGenerator } from '@ldesign/generator'

const generator = new ComponentGenerator('./templates', './src')

// 生成 Vue 组件
await generator.generateVueComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string', default: 'primary' },
    { name: 'size', type: "'small' | 'medium' | 'large'" }
  ],
  emits: ['click'],
  withStyle: true,
  withTest: true,
  styleType: 'scss',
  lang: 'ts'
})
```

### 使用插件
```typescript
import { Generator } from '@ldesign/generator'
import { stylePlugin, testPlugin, docPlugin } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [stylePlugin, testPlugin, docPlugin],
  config: {
    defaultLang: 'ts',
    styleType: 'scss',
    testFramework: 'vitest'
  }
})
```

### 生成完整模块
```typescript
import { PageGenerator, ApiGenerator } from '@ldesign/generator'

// 生成完整 CRUD 页面
const pageGen = new PageGenerator('./templates', './src/pages')
await pageGen.generateCrudPages({
  name: 'User',
  type: 'vue',
  withApi: true,
  withStore: true
})

// 生成 RESTful API
const apiGen = new ApiGenerator('./templates', './src/api')
await apiGen.generateRestfulApi({
  name: 'user',
  resource: 'users',
  withMock: true
})
```

## 高级特性

### 自定义模板
```ejs
<template>
  <div class="<%= kebabCase(componentName) %>">
    <%= componentName %>
  </div>
</template>

<script setup lang="<%= lang %>">
// 使用助手函数
const <%= camelCase(componentName) %> = ref()
</script>
```

### 自定义插件
```typescript
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  hooks: {
    onTemplateRender: async (context, content) => {
      // 修改模板内容
      return content.replace(/foo/g, 'bar')
    }
  }
})
```

### 配置文件
```typescript
// ldesign.config.ts
import type { FullConfig } from '@ldesign/generator'

export default {
  defaultLang: 'ts',
  styleType: 'scss',
  testFramework: 'vitest',
  prettier: true,
  nameCase: 'pascalCase',
  fileStructure: 'flat',
  plugins: []
} as FullConfig
```

## 性能特性

- ✅ **模板缓存** - 提高重复生成速度
- ✅ **配置缓存** - 减少文件系统访问
- ✅ **批量生成** - 一次生成多个文件
- ✅ **异步操作** - 非阻塞文件操作
- ✅ **并行处理** - 支持并发生成

## 代码质量

- ✅ **TypeScript** - 完整的类型定义
- ✅ **Prettier** - 自动代码格式化
- ✅ **错误处理** - 完善的错误捕获和提示
- ✅ **文档注释** - 详细的 JSDoc 注释
- ✅ **单元测试** - 测试覆盖（计划中）

## 兼容性

### Node.js
- ✅ Node.js >= 16.0.0

### 框架
- ✅ Vue 3.x
- ✅ React 16.8+
- ✅ TypeScript 5.x
- ✅ JavaScript ES6+

### 工具
- ✅ Vite
- ✅ Webpack
- ✅ Rollup
- ✅ Vitest
- ✅ Jest
- ✅ Pinia
- ✅ Redux
- ✅ Zustand

## 使用场景

### 1. 快速原型开发 🚀
快速生成组件和页面，加速原型迭代。

### 2. 团队协作 👥
统一代码风格和结构，提高团队协作效率。

### 3. 代码重构 🔧
批量生成新结构的代码，简化重构工作。

### 4. 教学培训 📖
标准化的代码模板，适合教学和培训。

### 5. 项目脚手架 🏗️
快速搭建项目基础结构。

## 总结

@ldesign/generator 是一个功能全面、易于使用、可扩展的代码生成工具，能够显著提升前端开发效率。无论是个人项目还是团队协作，都能从中受益。

**核心优势：**
- 🎯 功能强大 - 20+ 模板，覆盖常见场景
- 🔌 可扩展 - 完善的插件系统
- 💻 易用性 - 简洁的 CLI 和 API
- 📚 文档完善 - 详细的使用指南
- 🎨 灵活配置 - 满足不同需求
- ⚡ 高性能 - 缓存和优化机制

---

**版本**: v1.0.0
**更新时间**: 2025年10月23日


