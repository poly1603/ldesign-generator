# @ldesign/generator

🚀 LDesign 代码生成器 - 功能强大的前端代码生成工具，支持 Vue、React 组件、页面、API、Store 等多种模板生成。

## ✨ 特性

- 🎯 **丰富的模板库** - 内置 Vue、React、通用模板，涵盖组件、页面、Hook、Store、API 等
- 🔌 **插件系统** - 强大的插件架构，支持样式、测试、文档自动生成
- 🎨 **多模板引擎** - 支持 EJS 和 Handlebars 模板引擎
- 💅 **自动格式化** - 集成 Prettier 自动格式化生成的代码
- ⚙️ **灵活配置** - 支持配置文件，自定义生成规则
- 🛠️ **强大 CLI** - 交互式命令行工具，操作简单直观
- 📦 **可编程 API** - 完整的 TypeScript API，可集成到工作流
- 🔧 **生命周期钩子** - 插件可在生成过程的各个阶段介入

## 📦 安装

```bash
pnpm add -D @ldesign/generator
# or
npm install -D @ldesign/generator
# or
yarn add -D @ldesign/generator
```

## 🚀 快速开始

### 初始化配置

```bash
lgen init
```

### CLI 使用

```bash
# 生成 Vue 组件
lgen component -t vue -n MyButton

# 生成 React 页面
lgen page -t react -n UserList --crud list --with-api

# 生成 Hook/Composable
lgen hook -t vue -n useFetch --async

# 生成 Store
lgen store -t pinia -n user

# 生成 RESTful API
lgen api -n user --restful --with-mock

# 交互式生成（推荐）
lgen component
lgen page
```

### 命令别名

- `component` → `c`
- `page` → `p`
- `hook` → `h`
- `store` → `s`
- `api` → `a`

## 📖 详细使用

### 生成组件

#### Vue 组件

```bash
# 基础组件
lgen c -t vue -n MyButton

# TSX 组件
lgen c -t vue -n MyButton --tsx

# 自定义选项
lgen c -t vue -n MyButton --style-type scss --no-test
```

#### React 组件

```bash
# 函数组件
lgen c -t react -n MyButton

# 类组件
lgen c -t react -n MyButton --class

# 自定义选项
lgen c -t react -n MyButton --style-type less
```

### 生成页面

```bash
# CRUD 列表页
lgen p -t vue -n UserList --crud list --with-api --with-store

# 详情页
lgen p -t react -n UserDetail --crud detail --with-api

# 自定义页面
lgen p -t vue -n Dashboard
```

### 生成 Hook/Composable

```bash
# Vue Composable
lgen h -t vue -n useFetch --async

# React Hook
lgen h -t react -n useLocalStorage
```

### 生成 Store

```bash
# Pinia Store (Vue)
lgen s -t pinia -n user

# Zustand Store (React)
lgen s -t zustand -n user

# Redux Store (React)
lgen s -t redux -n user
```

### 生成 API

```bash
# RESTful API
lgen a -n user --restful --with-mock

# 自定义 API
lgen a -n custom
```

## ⚙️ 配置文件

在项目根目录创建 `ldesign.config.js`:

```javascript
export default {
  // 默认语言
  defaultLang: 'ts',
  
  // 样式类型
  styleType: 'scss',
  
  // 测试框架
  testFramework: 'vitest',
  
  // 代码格式化
  prettier: true,
  
  // 命名规范
  nameCase: 'pascalCase',
  
  // 文件结构
  fileStructure: 'flat',
  
  // 插件
  plugins: [
    // 自定义插件
  ]
}
```

## 🔌 插件系统

### 内置插件

#### 样式插件

自动生成对应的样式文件（CSS/SCSS/Less）。

```typescript
import { stylePlugin } from '@ldesign/generator'
```

#### 测试插件

自动生成测试文件（Vitest/Jest）。

```typescript
import { testPlugin } from '@ldesign/generator'
```

#### 文档插件

自动生成组件文档和示例。

```typescript
import { docPlugin } from '@ldesign/generator'
```

### 创建自定义插件

```typescript
import { definePlugin } from '@ldesign/generator'

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',
  
  hooks: {
    beforeGenerate: async (context) => {
      console.log('生成前执行')
    },
    
    afterGenerate: async (context, result) => {
      console.log('生成后执行')
    },
    
    onError: async (context, error) => {
      console.error('错误处理')
    },
    
    onTemplateRender: async (context, content) => {
      // 修改模板内容
      return content.replace(/foo/g, 'bar')
    }
  }
})
```

## 💻 编程 API

### 生成组件

```typescript
import { ComponentGenerator } from '@ldesign/generator'

const generator = new ComponentGenerator('./templates', './src/components')

// Vue 组件
await generator.generateVueComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string', default: 'primary' },
    { name: 'size', type: "'small' | 'medium' | 'large'", default: 'medium' }
  ],
  emits: ['click', 'change'],
  withStyle: true,
  withTest: true,
  styleType: 'scss',
  lang: 'ts',
  description: '自定义按钮组件'
})

// React 组件
await generator.generateReactComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string' },
    { name: 'onClick', type: '() => void' }
  ],
  withStyle: true,
  lang: 'tsx'
})

// Vue Composable
await generator.generateVueComposable({
  name: 'useFetch',
  type: 'vue',
  async: true,
  params: [
    { name: 'url', type: 'string' }
  ],
  returns: '{ data, loading, error, execute }' 
})

// React Hook
await generator.generateReactHook({
  name: 'useFetch',
  type: 'react',
  async: true
})

// Vue Store
await generator.generateVueStore({
  name: 'user',
  type: 'pinia',
  state: [
    { name: 'userInfo', type: 'User | null', default: null },
    { name: 'token', type: 'string', default: '' }
  ],
  actions: ['login', 'logout', 'fetchUserInfo']
})

// React Store (Zustand)
await generator.generateReactStore({
  name: 'user',
  type: 'zustand',
  state: [
    { name: 'user', type: 'User | null', default: null }
  ]
})
```

### 生成页面

```typescript
import { PageGenerator } from '@ldesign/generator'

const generator = new PageGenerator('./templates', './src/pages')

// Vue 页面
await generator.generateVuePage({
  name: 'UserList',
  crudType: 'list',
  withApi: true,
  withStore: true,
  route: '/users'
})

// React 页面
await generator.generateReactPage({
  name: 'UserList',
  crudType: 'list',
  withApi: true
})

// 生成完整 CRUD 页面
await generator.generateCrudPages({
  name: 'User',
  type: 'vue',
  withApi: true,
  withStore: true
})
```

### 生成 API

```typescript
import { ApiGenerator } from '@ldesign/generator'

const generator = new ApiGenerator('./templates', './src/api')

// RESTful API
await generator.generateRestfulApi({
  name: 'user',
  resource: 'users',
  withMock: true
})

// 自定义 API
await generator.generateApi({
  name: 'custom',
  baseUrl: '/api/v1',
  endpoints: [
    {
      name: 'getList',
      method: 'GET',
      path: '/list',
      params: ['page', 'size']
    },
    {
      name: 'create',
      method: 'POST',
      path: '/create',
      body: 'CreateInput'
    }
  ],
  withTypes: true,
  withMock: true
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
    testFramework: 'vitest',
    prettier: true
  }
})
```

## 📁 模板列表

### Vue 模板

- ✅ `vue/component.ejs` - Vue 3 组件（Composition API）
- ✅ `vue/component-tsx.ejs` - Vue TSX 组件
- ✅ `vue/page.ejs` - 完整页面模板
- ✅ `vue/composable.ejs` - Composable/Hook
- ✅ `vue/store.ejs` - Pinia Store
- ✅ `vue/directive.ejs` - 自定义指令
- ✅ `vue/plugin.ejs` - Vue 插件

### React 模板

- ✅ `react/component.ejs` - 函数组件
- ✅ `react/component-class.ejs` - 类组件
- ✅ `react/page.ejs` - 页面组件
- ✅ `react/hook.ejs` - 自定义 Hook
- ✅ `react/context.ejs` - Context Provider
- ✅ `react/hoc.ejs` - 高阶组件
- ✅ `react/store.ejs` - Redux/Zustand Store

### 通用模板

- ✅ `common/api.ejs` - API 请求模块
- ✅ `common/types.ejs` - TypeScript 类型定义
- ✅ `common/utils.ejs` - 工具函数
- ✅ `common/config.ejs` - 配置文件
- ✅ `common/test.ejs` - 测试文件
- ✅ `common/mock.ejs` - Mock 数据

## 🎨 自定义模板

创建自定义模板文件：

```ejs
<!-- my-template.ejs -->
<template>
  <div class="<%= kebabCase(componentName) %>">
    <h1><%= componentName %></h1>
    <% if (description) { %>
    <p><%= description %></p>
    <% } %>
  </div>
</template>

<script setup lang="<%= lang %>">
// 组件逻辑
</script>

<style scoped>
.<%= kebabCase(componentName) %> {
  /* 样式 */
}
</style>
```

使用自定义模板：

```typescript
import { Generator } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './my-templates',
  outputDir: './output'
})

await generator.generate('my-template.ejs', {
  componentName: 'MyComponent',
  description: '我的自定义组件',
  lang: 'ts'
})
```

## 🔧 模板助手函数

模板中可用的助手函数：

- `pascalCase(str)` - 转换为 PascalCase
- `camelCase(str)` - 转换为 camelCase
- `kebabCase(str)` - 转换为 kebab-case
- `snakeCase(str)` - 转换为 snake_case
- `upperCase(str)` - 转换为大写
- `lowerCase(str)` - 转换为小写
- `currentYear()` - 获取当前年份
- `currentDate()` - 获取当前日期

## 📚 API 文档

### Generator

主生成器类。

#### 构造函数

```typescript
new Generator(options: GeneratorOptions)
```

#### 方法

- `generate(templateName, data)` - 生成单个文件
- `generateBatch(items)` - 批量生成文件
- `getTemplateEngine()` - 获取模板引擎实例
- `getPluginManager()` - 获取插件管理器实例

### ComponentGenerator

组件生成器类。

#### 方法

- `generateVueComponent(options)` - 生成 Vue 组件
- `generateVueTsxComponent(options)` - 生成 Vue TSX 组件
- `generateVueComposable(options)` - 生成 Vue Composable
- `generateVueStore(options)` - 生成 Pinia Store
- `generateVueDirective(options)` - 生成 Vue 指令
- `generateVuePlugin(options)` - 生成 Vue 插件
- `generateReactComponent(options)` - 生成 React 组件
- `generateReactClassComponent(options)` - 生成 React 类组件
- `generateReactHook(options)` - 生成 React Hook
- `generateReactContext(options)` - 生成 React Context
- `generateReactHOC(options)` - 生成 React HOC
- `generateReactStore(options)` - 生成 React Store

### PageGenerator

页面生成器类。

#### 方法

- `generateVuePage(options)` - 生成 Vue 页面
- `generateReactPage(options)` - 生成 React 页面
- `generateCrudPages(options)` - 生成完整 CRUD 页面集合

### ApiGenerator

API 生成器类。

#### 方法

- `generateApi(options)` - 生成 API 模块
- `generateRestfulApi(options)` - 生成 RESTful API

### PluginManager

插件管理器类。

#### 方法

- `register(plugin)` - 注册插件
- `registerBatch(plugins)` - 批量注册插件
- `load(pluginName)` - 加载插件
- `loadAll()` - 加载所有插件
- `unload(pluginName)` - 卸载插件
- `getPlugin(pluginName)` - 获取插件
- `getLoadedPlugins()` - 获取所有已加载的插件

### ConfigLoader

配置加载器类。

#### 方法

- `loadConfig(searchPath)` - 加载配置文件
- `clearCache()` - 清除缓存
- `mergeConfig(baseConfig, userConfig)` - 合并配置

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 License

MIT © LDesign Team


