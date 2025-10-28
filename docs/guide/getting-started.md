# 快速开始

本指南将帮助你在 5 分钟内开始使用 `@ldesign/generator`。

## 安装

首先，安装 `@ldesign/generator` 到你的项目中：

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

## 初始化配置

运行初始化命令创建配置文件：

```bash
npx lgen init
```

这将创建一个 `ldesign.config.js` 文件：

```javascript
// ldesign.config.js
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
  plugins: []
}
```

## 生成第一个组件

### CLI 方式

使用交互式 CLI 生成组件：

```bash
npx lgen component
```

或者直接指定参数：

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

### API 方式

在代码中使用 API：

```typescript
import { ComponentGenerator } from '@ldesign/generator'

const generator = new ComponentGenerator('./templates', './src/components')

// 生成 Vue 组件
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
```

## 生成页面

### CRUD 列表页

```bash
# CLI
npx lgen page -t vue -n UserList --crud list --with-api --with-store

# API
import { PageGenerator } from '@ldesign/generator'

const pageGen = new PageGenerator('./templates', './src/pages')

await pageGen.generateVuePage({
  name: 'UserList',
  crudType: 'list',
  withApi: true,
  withStore: true,
  route: '/users'
})
```

### 完整 CRUD 系统

一次性生成列表、详情、编辑、创建四个页面：

```bash
# CLI（需要在代码中调用 API）

# API
await pageGen.generateCrudPages({
  name: 'User',
  type: 'vue',
  withApi: true,
  withStore: true
})
```

## 生成 API

### RESTful API

```bash
# CLI
npx lgen api -n user --restful --with-mock

# API
import { ApiGenerator } from '@ldesign/generator'

const apiGen = new ApiGenerator('./templates', './src/api')

await apiGen.generateRestfulApi({
  name: 'user',
  resource: 'users',
  withMock: true
})
```

这将生成：
- API 请求模块（`user.ts`）
- TypeScript 类型定义（`user.types.ts`）
- Mock 数据（`user.mock.ts`）

## 批量生成

创建配置文件 `batch.json`：

```json
[
  {
    "name": "Button",
    "template": "vue/component.ejs",
    "data": {
      "componentName": "Button",
      "props": [{ "name": "type", "type": "string" }]
    }
  },
  {
    "name": "Input",
    "template": "vue/component.ejs",
    "data": {
      "componentName": "Input",
      "props": [{ "name": "value", "type": "string" }]
    }
  }
]
```

批量生成：

```bash
npx lgen batch --config batch.json --parallel --max-concurrency 10
```

## 使用插件

启用内置插件：

```javascript
// ldesign.config.js
import { stylePlugin, testPlugin, docPlugin } from '@ldesign/generator'

export default {
  plugins: [
    stylePlugin,      // 自动生成样式文件
    testPlugin,       // 自动生成测试文件
    docPlugin         // 自动生成文档
  ]
}
```

或在代码中使用：

```typescript
import { Generator, stylePlugin, testPlugin } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [stylePlugin, testPlugin]
})
```

## 查看历史

```bash
# 查看最近 10 条记录
npx lgen history --limit 10

# 导出历史
npx lgen history --export ./history.json
```

## 回滚操作

如果生成有误，可以轻松回滚：

```bash
# 回滚最后一次操作
npx lgen rollback --last

# 干运行模式（查看效果但不执行）
npx lgen rollback --last --dry-run
```

## 下一步

现在你已经掌握了基本用法，可以：

- 📖 阅读[核心概念](/guide/generators)了解生成器工作原理
- 🎨 查看[模板引擎](/guide/templates)学习自定义模板
- 🔌 探索[插件系统](/guide/plugins)扩展功能
- 💡 参考[最佳实践](/guide/best-practices/development)提升效率
- 📚 查看[API 文档](/api/overview)了解完整 API

## 常见问题

### 如何自定义模板？

参考[模板引擎](/guide/templates)文档。

### 如何开发插件？

参考[插件开发](/api/plugin-development)文档。

### 遇到问题怎么办？

查看[故障排除](/guide/best-practices/troubleshooting)或在 [GitHub](https://github.com/ldesign/generator/issues) 提问。
