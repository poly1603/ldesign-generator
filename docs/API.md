# @ldesign/generator API 文档

## 核心类

### Generator

主生成器类，集成所有高级功能。

#### 构造函数

```typescript
constructor(options: GeneratorOptions)
```

**参数**:
- `options.templateDir` (string) - 模板目录路径
- `options.outputDir` (string) - 输出目录路径
- `options.plugins` (Plugin[]) - 可选，插件数组
- `options.config` (GeneratorConfig) - 可选，生成器配置

**示例**:
```typescript
import { Generator } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './output',
  plugins: [],
  config: {
    prettier: true,
    defaultLang: 'ts'
  }
})
```

#### 方法

##### generate()

生成单个文件。

```typescript
async generate(templateName: string, data: Record<string, any>): Promise<GenerateResult>
```

**参数**:
- `templateName` - 模板名称（相对于templateDir）
- `data` - 模板数据

**返回**: Promise<GenerateResult>

**示例**:
```typescript
const result = await generator.generate('vue/component.ejs', {
  componentName: 'MyButton',
  withStyle: true
})

if (result.success) {
  console.log('生成成功:', result.outputPath)
}
```

##### generateBatch()

批量生成文件。

```typescript
async generateBatch(items: Array<{ template: string; data: Record<string, any> }>): Promise<GenerateResult[]>
```

**参数**:
- `items` - 批量生成项数组

**返回**: Promise<GenerateResult[]>

**示例**:
```typescript
const results = await generator.generateBatch([
  { template: 'vue/component.ejs', data: { componentName: 'Button' } },
  { template: 'vue/component.ejs', data: { componentName: 'Input' } }
])
```

##### getTemplateEngine()

获取模板引擎实例。

```typescript
getTemplateEngine(): TemplateEngine
```

##### getPluginManager()

获取插件管理器实例。

```typescript
getPluginManager(): PluginManager
```

---

### ComponentGenerator

组件生成器，专门用于生成 Vue/React 组件。

#### 构造函数

```typescript
constructor(templateDir: string, outputDir: string)
```

#### 方法

##### generateVueComponent()

生成 Vue 组件。

```typescript
async generateVueComponent(options: ComponentOptions): Promise<GenerateResult>
```

**选项**:
```typescript
interface ComponentOptions {
  name: string                    // 组件名称
  props?: PropDefinition[]        // Props 定义
  emits?: string[]               // 事件定义
  withScript?: boolean           // 是否包含 script 标签
  withStyle?: boolean            // 是否生成样式文件
  withTypes?: boolean            // 是否生成类型定义
  withTest?: boolean             // 是否生成测试文件
  lang?: 'ts' | 'js'            // 语言
  styleType?: StyleType          // 样式类型
  description?: string           // 描述
}
```

**示例**:
```typescript
const generator = new ComponentGenerator('./templates', './src/components')

await generator.generateVueComponent({
  name: 'MyButton',
  props: [
    { name: 'type', type: 'string', default: 'primary' },
    { name: 'size', type: "'small' | 'medium' | 'large'", default: 'medium' }
  ],
  emits: ['click', 'change'],
  withStyle: true,
  withTest: true
})
```

##### generateVueTsxComponent()

生成 Vue TSX 组件。

```typescript
async generateVueTsxComponent(options: ComponentOptions): Promise<GenerateResult>
```

##### generateVueComposable()

生成 Vue Composable。

```typescript
async generateVueComposable(options: HookOptions): Promise<GenerateResult>
```

**选项**:
```typescript
interface HookOptions {
  name: string
  type: 'vue' | 'react'
  params?: Array<{ name: string; type: string }>
  returns?: string
  async?: boolean
  withTest?: boolean
  description?: string
}
```

##### generateVueStore()

生成 Pinia Store。

```typescript
async generateVueStore(options: StoreOptions): Promise<GenerateResult>
```

**选项**:
```typescript
interface StoreOptions {
  name: string
  type: 'pinia' | 'vuex' | 'redux' | 'zustand'
  state?: Array<{ name: string; type: string; default?: any }>
  actions?: string[]
  withTypes?: boolean
  withPersist?: boolean
  description?: string
}
```

##### generateReactComponent()

生成 React 函数组件。

```typescript
async generateReactComponent(options: ComponentOptions): Promise<GenerateResult>
```

##### generateReactHook()

生成 React Hook。

```typescript
async generateReactHook(options: HookOptions): Promise<GenerateResult>
```

---

### PageGenerator

页面生成器，用于生成完整页面。

#### 方法

##### generateVuePage()

生成 Vue 页面。

```typescript
async generateVuePage(options: PageOptions): Promise<GenerateResult>
```

**选项**:
```typescript
interface PageOptions extends ComponentOptions {
  route?: string                 // 路由路径
  layout?: string               // 布局名称
  withStore?: boolean           // 是否包含状态管理
  withApi?: boolean             // 是否包含 API 调用
  crudType?: 'list' | 'detail' | 'edit' | 'create' | 'none'
}
```

**示例**:
```typescript
const generator = new PageGenerator('./templates', './src/pages')

await generator.generateVuePage({
  name: 'UserList',
  crudType: 'list',
  withApi: true,
  withStore: true,
  route: '/users'
})
```

##### generateCrudPages()

生成完整的 CRUD 页面集合。

```typescript
async generateCrudPages(options: {
  name: string
  type: 'vue' | 'react'
  withApi?: boolean
  withStore?: boolean
  lang?: LanguageType
}): Promise<GenerateResult[]>
```

**示例**:
```typescript
const results = await generator.generateCrudPages({
  name: 'User',
  type: 'vue',
  withApi: true,
  withStore: true
})
// 生成: UserList, UserDetail, UserEdit, UserCreate 四个页面
```

---

### ApiGenerator

API 生成器，用于生成 API 请求模块。

#### 方法

##### generateApi()

生成自定义 API 模块。

```typescript
async generateApi(options: ApiOptions): Promise<GenerateResult>
```

**选项**:
```typescript
interface ApiOptions {
  name: string
  baseUrl?: string
  endpoints?: Endpoint[]
  withTypes?: boolean
  withMock?: boolean
  description?: string
}

interface Endpoint {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  params?: string[]
  body?: string
  response?: string
}
```

**示例**:
```typescript
const generator = new ApiGenerator('./templates', './src/api')

await generator.generateApi({
  name: 'user',
  baseUrl: '/api/v1',
  endpoints: [
    {
      name: 'getList',
      method: 'GET',
      path: '/users',
      params: ['page', 'size']
    },
    {
      name: 'create',
      method: 'POST',
      path: '/users',
      body: 'CreateUserDto'
    }
  ],
  withTypes: true,
  withMock: true
})
```

##### generateRestfulApi()

生成标准 RESTful API。

```typescript
async generateRestfulApi(options: {
  name: string
  resource: string
  baseUrl?: string
  withMock?: boolean
}): Promise<GenerateResult[]>
```

**示例**:
```typescript
const results = await generator.generateRestfulApi({
  name: 'user',
  resource: 'users',
  withMock: true
})
// 生成: getList, getDetail, create, update, remove 5个标准方法
```

---

## 工具类

### 字符串工具

```typescript
import {
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  toConstantCase,
  capitalize,
  truncate,
  pluralize
} from '@ldesign/generator/utils'
```

**示例**:
```typescript
toCamelCase('hello-world')      // 'helloWorld'
toPascalCase('hello-world')     // 'HelloWorld'
toKebabCase('HelloWorld')       // 'hello-world'
toSnakeCase('HelloWorld')       // 'hello_world'
toConstantCase('helloWorld')    // 'HELLO_WORLD'
capitalize('hello')             // 'Hello'
truncate('very long text...', 10) // 'very lo...'
pluralize('user')               // 'users'
```

### 格式化工具

```typescript
import {
  formatBytes,
  formatDuration,
  formatDate,
  formatNumber,
  formatPercentage,
  createProgressBar
} from '@ldesign/generator/utils'
```

**示例**:
```typescript
formatBytes(1024)                        // '1.00 KB'
formatDuration(1500)                     // '1.50s'
formatDate(new Date(), 'YYYY-MM-DD')     // '2024-01-01'
formatPercentage(0.856)                  // '85.60%'
createProgressBar(75, 100, 20)           // '███████████████░░░░░ 75.0%'
```

### 路径工具

```typescript
import {
  safeJoinPath,
  isPathSafe,
  sanitizeFileName,
  getExtension,
  generateUniqueFileName
} from '@ldesign/generator/utils'
```

**示例**:
```typescript
safeJoinPath('/base', '../test')         // 抛出错误（路径遍历）
isPathSafe('valid/path.txt')             // true
isPathSafe('../../../etc/passwd')        // false
sanitizeFileName('invalid:name?.txt')    // 'invalid_name_.txt'
getExtension('file.vue')                 // 'vue'
```

---

## 插件系统

### 使用内置插件

```typescript
import { stylePlugin, testPlugin, typescriptPlugin, eslintPlugin } from '@ldesign/generator'

const generator = new Generator({
  templateDir: './templates',
  outputDir: './output',
  plugins: [stylePlugin, testPlugin, typescriptPlugin, eslintPlugin]
})
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
      console.log('生成前:', context.templateName)
    },
    
    afterGenerate: async (context, result) => {
      console.log('生成后:', result.outputPath)
    },
    
    onTemplateRender: async (context, content) => {
      // 可以修改模板渲染后的内容
      return content.replace(/foo/g, 'bar')
    },
    
    onError: async (context, error) => {
      console.error('错误:', error.message)
    }
  }
})
```

### 可用的生命周期钩子

- `beforeGenerate` - 生成前执行
- `afterGenerate` - 生成后执行
- `onTemplateRender` - 模板渲染后执行（可修改内容）
- `onError` - 发生错误时执行

---

## 错误处理

### 错误类型

```typescript
import {
  GeneratorError,
  TemplateError,
  FileSystemError,
  ConfigError,
  PluginError,
  ValidationError,
  ErrorFactory
} from '@ldesign/generator'
```

### 使用 ErrorFactory

```typescript
// 创建模板未找到错误
throw ErrorFactory.templateNotFound('my-template.ejs')

// 创建文件已存在错误
throw ErrorFactory.fileAlreadyExists('/path/to/file')

// 创建验证错误
throw ErrorFactory.validationError('验证失败', [
  { field: 'name', message: '名称不能为空' }
])
```

### 错误处理最佳实践

```typescript
try {
  await generator.generate('template.ejs', data)
} catch (error) {
  if (error instanceof TemplateError) {
    console.error('模板错误:', error.message)
    if (error.suggestion) {
      console.log('建议:', error.suggestion)
    }
  } else if (error instanceof ValidationError) {
    console.error('验证错误:', error.validationErrors)
  } else {
    console.error('未知错误:', error)
  }
}
```

---

## 输入验证

### InputValidator

```typescript
import { InputValidator, validateComponentName } from '@ldesign/generator'

// 验证组件名称
validateComponentName('MyButton')  // 通过
validateComponentName('123')       // 抛出错误

// 自定义验证
const result = InputValidator.validateFields(
  { name: 'test', email: 'test@example.com' },
  {
    name: [
      InputValidator.required('名称'),
      InputValidator.minLength('名称', 2)
    ],
    email: [
      InputValidator.required('邮箱'),
      InputValidator.pattern('邮箱', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ]
  }
)

if (!result.valid) {
  console.error('验证失败:', result.errors)
}
```

---

## 缓存系统

### CacheManager

```typescript
import { cacheManager } from '@ldesign/generator'

// 获取缓存统计
const stats = cacheManager.getStats()
console.log('缓存命中率:', stats.hitRate)

// 清除缓存
cacheManager.invalidate('all')

// 预热缓存
await cacheManager.warmup([
  { key: 'template:vue/component.ejs', content: '...' }
])
```

### PersistentCache

```typescript
import { createPersistentCache } from '@ldesign/generator'

const cache = createPersistentCache('my-cache', {
  enabled: true,
  ttl: 86400000, // 24小时
  maxSize: 100   // 100MB
})

await cache.set('key', { data: 'value' })
const value = await cache.get('key')

// 导出缓存
await cache.export('./cache-backup.json')

// 导入缓存
await cache.import('./cache-backup.json')
```

---

## 性能监控

### PerformanceMonitor

```typescript
import { performanceMonitor } from '@ldesign/generator'

// 测量函数执行时间
const result = await performanceMonitor.measure('myOperation', async () => {
  // 执行操作
  return await someAsyncOperation()
})

// 获取统计信息
const stats = performanceMonitor.getStats()
console.log('平均耗时:', stats.averageDuration)

// 生成性能报告
const report = performanceMonitor.generateReport({
  format: 'text',
  showMemory: true
})
console.log(report)
```

---

## 任务队列

### TaskQueue

```typescript
import { createTaskQueue, TaskPriority } from '@ldesign/generator'

const queue = createTaskQueue({
  maxConcurrent: 5,
  defaultTimeout: 30000,
  defaultRetries: 2
})

// 添加任务
const taskId = await queue.add({
  name: 'generate-component',
  priority: TaskPriority.HIGH,
  executor: async () => {
    return await generator.generate('template.ejs', data)
  },
  timeout: 5000,
  retries: 3
})

// 等待任务完成
const result = await queue.waitFor(taskId)

// 获取统计
const stats = queue.getStats()
console.log('队列状态:', stats)
```

---

## 历史管理

### HistoryManager

```typescript
import { historyManager } from '@ldesign/generator'

// 查询最近记录
const recent = historyManager.getRecent(10)

// 查询特定记录
const records = historyManager.query({
  operation: 'generate',
  success: true,
  limit: 20
})

// 导出历史
await historyManager.export('./history.json', 'json')

// 清理旧记录
await historyManager.clearOld(30) // 保留30天内的记录
```

---

## 回滚管理

### RollbackManager

```typescript
import { rollbackManager } from '@ldesign/generator'

// 回滚最近的操作
await rollbackManager.rollbackLast({
  backup: true,      // 创建备份
  interactive: true  // 交互式确认
})

// 回滚特定操作
await rollbackManager.rollback('history-id', {
  force: false,      // 检查文件是否被修改
  dryRun: false      // 是否干运行
})
```

---

## 干运行和预览

### DryRunGenerator

```typescript
import { DryRunGenerator } from '@ldesign/generator'

const dryGen = new DryRunGenerator({
  templateDir: './templates',
  outputDir: './output'
})

// 干运行
const result = await dryGen.dryRunGenerate('template.ejs', data)

console.log('将创建文件:', result.totalFiles)
console.log('预计大小:', result.estimatedSize)
console.log('警告:', result.warnings)

// 显示结果
DryRunGenerator.displayResult(result, { showContent: true })
```

### PreviewGenerator

```typescript
import { PreviewGenerator } from '@ldesign/generator'

const previewGen = new PreviewGenerator({
  templateDir: './templates',
  outputDir: './output'
})

const result = await previewGen.generatePreview(
  'template.ejs',
  data,
  {
    showLineNumbers: true,
    showDiff: true,
    interactive: true
  }
)

if (result.approved) {
  // 用户确认后，实际生成
  await generator.generate('template.ejs', data)
}
```

---

## 批量生成

### BatchGenerator

```typescript
import { BatchGenerator } from '@ldesign/generator'

const batchGen = new BatchGenerator({
  templateDir: './templates',
  outputDir: './output'
})

const result = await batchGen.generateBatch(
  [
    { name: 'Button', template: 'vue/component.ejs', data: { ... } },
    { name: 'Input', template: 'vue/component.ejs', data: { ... } }
  ],
  {
    parallel: true,           // 并行生成
    maxConcurrency: 5,        // 最大并发数
    continueOnError: true,    // 出错后继续
    showProgress: true        // 显示进度
  }
)

// 显示结果
BatchGenerator.displayResult(result)
```

---

## 配置管理

### ConfigLoader

```typescript
import { loadConfig, configLoader } from '@ldesign/generator'

// 加载配置文件
const config = await loadConfig()

// 合并配置
const merged = configLoader.mergeConfig(baseConfig, userConfig)

// 清除缓存
configLoader.clearCache()
```

---

## 国际化

### i18n

```typescript
import { i18n, t } from '@ldesign/generator'

// 翻译文本
const message = t('common.success')
const formatted = t('cli.generatedFiles', { count: 5 })

// 设置语言
i18n.setLocale('en-US')

// 复数处理
const text = i18n.plural('file.count', 5, { count: 5 })

// 格式化日期
const date = i18n.formatDate(new Date(), 'medium')

// 格式化数字
const number = i18n.formatNumber(1234567.89)
```

---

## 模板引擎

### TemplateEngine

```typescript
import { TemplateEngine } from '@ldesign/generator'

const engine = new TemplateEngine('./templates')

// 渲染模板
const content = await engine.render('template.ejs', {
  name: 'MyComponent',
  props: []
})

// 注册自定义模板
engine.registerTemplate('my-template', '<div><%= name %></div>')

// 注册自定义助手（Handlebars）
engine.registerHelper('uppercase', (str: string) => str.toUpperCase())

// 清除缓存
engine.clearTemplateCache('template.ejs')

// 预热缓存
await engine.warmupCache(['vue/component.ejs', 'react/component.ejs'])
```

---

## 模板验证

### TemplateValidator

```typescript
import { TemplateValidator, validate } from '@ldesign/generator'

// 快速验证
const result = validate(templateContent, 'ejs', {
  checkSyntax: true,
  checkBestPractices: true
})

if (!result.valid) {
  console.error('验证失败:', result.errors, '个错误')
  result.issues.forEach(issue => {
    console.log(`[${issue.severity}] ${issue.message}`)
    if (issue.suggestion) {
      console.log('建议:', issue.suggestion)
    }
  })
}

// 创建验证器实例
const validator = new TemplateValidator({
  checkSyntax: true,
  requiredFields: ['componentName', 'props']
})

// 添加自定义规则
validator.addRule({
  name: 'no-console',
  check: (content) => {
    if (content.includes('console.log')) {
      return [{
        severity: 'warning',
        message: '不建议使用 console.log',
        rule: 'no-console'
      }]
    }
    return []
  }
})
```

---

## 类型定义

### 主要类型

```typescript
// 生成结果
interface GenerateResult {
  success: boolean
  outputPath?: string
  error?: string
  message: string
  metadata?: Record<string, any>
}

// 生成器选项
interface GeneratorOptions {
  templateDir: string
  outputDir: string
  plugins?: Plugin[]
  config?: GeneratorConfig
}

// 生成器配置
interface GeneratorConfig {
  nameCase?: NamingStyle
  fileStructure?: 'flat' | 'nested'
  defaultLang?: LanguageType
  styleType?: StyleType
  testFramework?: TestFrameworkType
  prettier?: boolean
}

// 命名风格
type NamingStyle = 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase' | 'constantCase'

// 语言类型
type LanguageType = 'ts' | 'js' | 'tsx' | 'jsx'

// 样式类型
type StyleType = 'css' | 'scss' | 'less' | 'stylus' | 'none' | 'tailwind' | 'css-modules'

// 测试框架类型
type TestFrameworkType = 'vitest' | 'jest' | 'none'
```

---

## 高级用法

### 自定义模板引擎

```typescript
const generator = new Generator(options)
const engine = generator.getTemplateEngine()

// 注册自定义 Handlebars 助手
engine.registerHelper('formatDate', (date: Date) => {
  return date.toISOString()
})
```

### 链式操作

```typescript
// 生成组件 -> 生成测试 -> 生成文档
const results = await Promise.all([
  generator.generate('component.ejs', data),
  generator.generate('test.ejs', data),
  generator.generate('doc.ejs', data)
])
```

### 条件生成

```typescript
const options = {
  name: 'MyButton',
  withStyle: true,
  withTest: process.env.NODE_ENV !== 'production'
}

await componentGenerator.generateVueComponent(options)
```

---

## 最佳实践

1. **始终验证输入**
   ```typescript
   validateComponentName(options.name)
   ```

2. **使用工具函数**
   ```typescript
   import { toPascalCase } from '@ldesign/generator/utils'
   ```

3. **处理错误**
   ```typescript
   try {
     await generator.generate(...)
   } catch (error) {
     if (error instanceof GeneratorError) {
       console.error(error.message, error.suggestion)
     }
   }
   ```

4. **使用缓存**
   ```typescript
   await engine.warmupCache(commonTemplates)
   ```

5. **批量操作时使用任务队列**
   ```typescript
   const batchGen = new BatchGenerator(options)
   await batchGen.generateBatch(configs, { parallel: true })
   ```

---

## 常见问题

### Q: 如何自定义模板？
A: 创建 .ejs 或 .hbs 文件，使用模板引擎的语法。

### Q: 如何添加自定义插件？
A: 使用 `definePlugin` 创建插件，注册生命周期钩子。

### Q: 性能优化建议？
A: 使用缓存预热、启用并行生成、使用任务队列。

### Q: 如何调试？
A: 启用 DEBUG 日志级别，查看详细执行日志。

---

## 参考链接

- [GitHub 仓库](https://github.com/ldesign/generator)
- [使用指南](./USAGE_GUIDE.md)
- [最佳实践](./BEST_PRACTICES.md)
- [示例代码](../examples/)


