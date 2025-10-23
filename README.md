# @ldesign/generator

LDesign 代码生成器 - 快速生成组件、页面、配置文件等，提升开发效率。

## 特性

- 🚀 快速生成 Vue/React 组件
- 📝 支持自定义模板
- 🎨 支持 EJS 和 Handlebars 模板引擎
- 💅 自动代码格式化
- 🛠️ 强大的 CLI 工具
- 📦 可编程 API

## 安装

```bash
pnpm add -D @ldesign/generator
```

## 使用

### CLI 方式

```bash
# 生成 Vue 组件
ldesign-generate component --type vue --name MyComponent

# 生成 React 组件
ldesign-generate component --type react --name MyComponent

# 交互式生成
ldesign-generate component

# 使用简写命令
lgen component -t vue -n MyComponent
```

### API 方式

```typescript
import { ComponentGenerator, Generator } from '@ldesign/generator'

// 生成 Vue 组件
const vueGenerator = new ComponentGenerator('./templates', './src/components')
await vueGenerator.generateVueComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string' },
    { name: 'size', type: "'small' | 'medium' | 'large'" }
  ],
  emits: ['click', 'change'],
  withStyle: true,
  lang: 'ts'
})

// 生成 React 组件
await vueGenerator.generateReactComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string' },
    { name: 'onClick', type: '() => void' }
  ],
  withTypes: true,
  lang: 'tsx'
})

// 使用自定义模板
const generator = new Generator({
  templateDir: './my-templates',
  outputDir: './output'
})

await generator.generate('my-template.ejs', {
  name: 'MyComponent',
  description: '自定义组件'
})
```

### 自定义模板

在项目中创建 `templates` 目录，添加模板文件：

```ejs
<!-- vue-component.ejs -->
<template>
  <div class="<%= kebabCase %>">
    <%= componentName %>
  </div>
</template>

<script lang="ts" setup>
interface Props {
<% props.forEach(prop => { %>
  <%= prop.name %>: <%= prop.type %>
<% }) %>
}

const props = defineProps<Props>()
</script>

<style scoped>
.<%= kebabCase %> {
  /* 样式 */
}
</style>
```

## API 文档

### Generator

主生成器类。

#### 构造函数

```typescript
new Generator(options: GeneratorOptions)
```

#### 方法

- `generate(templateName, data)` - 生成单个文件
- `generateBatch(items)` - 批量生成文件

### ComponentGenerator

组件生成器。

#### 方法

- `generateVueComponent(options)` - 生成 Vue 组件
- `generateReactComponent(options)` - 生成 React 组件

### TemplateEngine

模板引擎。

#### 方法

- `render(templateName, data)` - 渲染模板
- `registerHelper(name, fn)` - 注册 Handlebars 助手函数

## License

MIT


