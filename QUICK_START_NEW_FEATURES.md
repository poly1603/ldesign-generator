# 🚀 新增功能快速入门

快速上手 `@ldesign/generator` v2.0.0 的新增功能。

---

## 📦 安装

```bash
pnpm add -D @ldesign/generator
# or
npm install -D @ldesign/generator
```

---

## 🎯 Angular 支持（新增）

### 生成 Angular 组件

```bash
# CLI 方式（需要添加到 CLI）
lgen c -t angular -n UserProfile --standalone

# API 方式
import { ComponentGenerator } from '@ldesign/generator'

const gen = new ComponentGenerator('./templates', './src/angular')

await gen.generateAngularComponent({
  name: 'UserProfile',
  standalone: true,
  withService: true
})
```

### 生成 Angular 服务

```typescript
await gen.generateAngularService({
  name: 'User',
  withTypes: true,
  retry: true,
  apiUrl: '/api/users'
})
```

### 生成 Angular 模块

```typescript
await gen.generateAngularModule({
  name: 'User',
  components: ['UserList', 'UserDetail'],
  withRouter: true,
  routes: [
    { path: '', component: 'UserList' },
    { path: ':id', component: 'UserDetail' }
  ]
})
```

### 其他 Angular 生成器

```typescript
// 指令
await gen.generateAngularDirective({ name: 'Highlight' })

// 管道
await gen.generateAngularPipe({ name: 'FormatDate' })

// 守卫
await gen.generateAngularGuard({
  name: 'Auth',
  type: 'CanActivate'
})
```

---

## 🔄 批量生成（新增）

### CLI 方式

```bash
# 从配置文件批量生成
lgen batch --config batch.json --parallel

# 从 CSV 文件批量生成
lgen batch --csv components.csv --template vue/component.ejs

# 干运行模式（不实际生成）
lgen batch --config batch.json --dry-run
```

### API 方式

```typescript
import { BatchGenerator } from '@ldesign/generator'

const batchGen = new BatchGenerator({
  templateDir: './templates',
  outputDir: './src/components'
})

const configs = [
  {
    name: 'Button',
    template: 'vue/component.ejs',
    data: { componentName: 'Button' }
  },
  {
    name: 'Input',
    template: 'vue/component.ejs',
    data: { componentName: 'Input' }
  }
]

// 批量生成
const result = await batchGen.generateBatch(configs, {
  parallel: true,
  maxConcurrency: 10,
  showProgress: true
})

console.log(`成功: ${result.success}/${result.total}`)
```

### 配置文件示例

**batch.json**
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
      "componentName": "Input"
    }
  }
]
```

**components.csv**
```csv
name,description,type
Button,按钮组件,primary
Input,输入框组件,text
Select,选择器组件,single
```

---

## 🔙 回滚操作（新增）

### CLI 方式

```bash
# 回滚最后一次操作
lgen rollback --last

# 回滚指定操作
lgen rollback --id <history-id>

# 干运行模式（查看效果但不执行）
lgen rollback --last --dry-run

# 强制回滚（忽略文件修改警告）
lgen rollback --last --force
```

### API 方式

```typescript
import { rollbackManager } from '@ldesign/generator'

// 回滚最后一次操作
await rollbackManager.rollbackLast({
  dryRun: false,
  force: false,
  backup: true,
  interactive: true
})

// 回滚指定操作
await rollbackManager.rollback('history-id', {
  backup: true
})

// 批量回滚
const results = await rollbackManager.rollbackMultiple(
  ['id1', 'id2', 'id3'],
  { backup: true }
)
```

---

## 📜 历史记录（新增）

### CLI 方式

```bash
# 查看最近 20 条记录
lgen history --limit 20

# 按操作类型过滤
lgen history --operation generate

# 导出历史
lgen history --export ./history.json
lgen history --export ./history.csv
```

### API 方式

```typescript
import { historyManager } from '@ldesign/generator'

// 查看最近记录
const recent = historyManager.getRecent(10)

// 查询历史
const filtered = historyManager.query({
  operation: 'generate',
  templateName: 'vue/component',
  success: true,
  limit: 50
})

// 获取统计信息
const stats = historyManager.getStats()
console.log(`总操作: ${stats.total}`)
console.log(`成功率: ${stats.successRate}`)

// 导出历史
await historyManager.export('./history.json', 'json')
await historyManager.export('./history.csv', 'csv')

// 清理旧记录（保留30天）
const removed = await historyManager.clearOld(30)
```

---

## ✅ 模板验证（新增）

### CLI 方式

```bash
# 验证单个模板
lgen validate --template vue/component.ejs

# 验证所有模板
lgen validate --all
```

### API 方式

```typescript
import { validate, TemplateValidator } from '@ldesign/generator'
import fs from 'fs-extra'

// 读取模板
const content = await fs.readFile('./templates/vue/component.ejs', 'utf-8')

// 快速验证
const result = validate(content, 'ejs')

if (result.valid) {
  console.log('✓ 验证通过')
  console.log(`质量分数: ${result.quality}`)
} else {
  console.log('✗ 验证失败')
  console.log(TemplateValidator.formatResult(result))
}

// 查看具体问题
result.issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.message}`)
  if (issue.suggestion) {
    console.log(`  建议: ${issue.suggestion}`)
  }
})
```

---

## 📊 性能监控

```typescript
import { performanceMonitor } from '@ldesign/generator'

// 手动监控
performanceMonitor.start('my-operation')
// ... 执行操作 ...
const duration = performanceMonitor.end('my-operation')

// 使用 measure 方法
await performanceMonitor.measure('generate', async () => {
  await generator.generateVueComponent({...})
})

// 获取统计信息
const stats = performanceMonitor.getStats()
console.log(`平均耗时: ${stats.averageDuration}ms`)

// 分析性能瓶颈
const analysis = performanceMonitor.analyzeBottlenecks(500)
console.log('优化建议:')
analysis.recommendations.forEach(r => console.log(`  - ${r}`))

// 生成报告
const report = performanceMonitor.generateReport({
  format: 'text',
  showMemory: true
})
console.log(report)
```

---

## 🎨 完整工作流示例

结合所有新功能的完整示例：

```typescript
import {
  ComponentGenerator,
  validate,
  PreviewGenerator,
  performanceMonitor,
  historyManager,
  rollbackManager
} from '@ldesign/generator'
import fs from 'fs-extra'

async function generateWithFullWorkflow() {
  // 1. 验证模板
  const templateContent = await fs.readFile(
    './templates/vue/component.ejs',
    'utf-8'
  )
  const validationResult = validate(templateContent)

  if (!validationResult.valid) {
    console.error('❌ 模板验证失败')
    return
  }

  // 2. 预览代码
  const previewGen = new PreviewGenerator({
    templateDir: './templates',
    outputDir: './src/components'
  })

  const preview = await previewGen.generatePreview(
    'vue/component.ejs',
    { componentName: 'MyButton' },
    {
      showDiff: true,
      interactive: true,
      showLineNumbers: true
    }
  )

  if (!preview.approved) {
    console.log('⚠️  用户取消生成')
    return
  }

  // 3. 实际生成
  const generator = new ComponentGenerator('./templates', './src/components')

  const result = await generator.generateVueComponent({
    name: 'MyButton',
    props: [{ name: 'type', type: 'string' }],
    withStyle: true,
    withTest: true
  })

  if (!result.success) {
    console.error('❌ 生成失败')
    return
  }

  console.log('✅ 生成成功!')

  // 4. 检查性能
  const perfStats = performanceMonitor.getStats()
  if (perfStats.averageDuration > 100) {
    console.warn('⚠️  生成较慢，考虑优化')
  }

  // 5. 查看历史
  const recent = historyManager.getRecent(5)
  console.log(`最近生成了 ${recent.length} 个文件`)

  // 6. 如果需要，可以回滚
  // await rollbackManager.rollbackLast()
}

// 运行
generateWithFullWorkflow()
```

---

## 🔗 CLI 命令速查表

### 原有命令

```bash
lgen component -t vue -n MyButton           # 生成组件
lgen page -t react -n UserList --crud list  # 生成页面
lgen hook -t vue -n useFetch --async        # 生成 Hook
lgen store -t pinia -n user                 # 生成 Store
lgen api -n user --restful --with-mock      # 生成 API
lgen init                                    # 初始化配置
```

### 新增命令

```bash
lgen batch --config batch.json --parallel   # 批量生成
lgen rollback --last                        # 回滚操作
lgen history --limit 20                     # 查看历史
lgen validate --all                         # 验证模板
```

### 命令别名

- `component` → `c`
- `page` → `p`
- `hook` → `h`
- `store` → `s`
- `api` → `a`
- `batch` → `b`
- `rollback` → `r`

---

## 💡 最佳实践

### 1. 开发环境
- 使用 `--dry-run` 模式测试
- 启用性能监控
- 使用预览功能确认代码

### 2. 批量生成
- 使用 `--parallel` 提高速度
- 设置合理的 `--max-concurrency`
- 启用 `showProgress` 查看进度

### 3. 历史管理
- 定期导出历史记录
- 使用 `clearOld()` 清理旧记录
- 生成前验证模板

### 4. 回滚操作
- 总是启用 `backup` 选项
- 使用 `--dry-run` 预览效果
- 谨慎使用 `--force` 选项

---

## 📚 更多资源

- [完整文档](./README.md)
- [功能清单](./FEATURES.md)
- [高级功能](./ADVANCED_FEATURES.md)
- [新增功能总结](./NEW_FEATURES_SUMMARY.md)
- [完整示例](./examples/new-features.ts)

---

## 🎉 开始使用

```bash
# 初始化配置
lgen init

# 生成第一个组件
lgen c -n MyFirstComponent

# 查看历史
lgen history

# 如果需要，可以回滚
lgen rollback --last
```

**享受高效的代码生成体验！** 🚀
