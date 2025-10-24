# 🚀 Generator 快速参考

## 📋 常用命令

### 生成组件
```bash
# Vue 组件
lgen c -t vue -n MyButton
lgen c -t vue -n MyButton --tsx --style-type scss

# React 组件
lgen c -t react -n MyButton
lgen c -t react -n MyButton --class

# Angular 组件
lgen c -t angular -n MyButton
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
# Pinia (Vue)
lgen s -t pinia -n user

# Zustand (React)
lgen s -t zustand -n user

# Redux (React)
lgen s -t redux -n user
```

### 生成 API
```bash
# RESTful API
lgen a -n user --restful --with-mock

# 自定义 API
lgen a -n custom
```

### 其他命令
```bash
# 初始化配置
lgen init

# 干运行（预览）
lgen c -n MyButton --dry-run

# 查看历史
lgen history list

# 回滚操作
lgen rollback --last
```

---

## 💻 API 使用

### 基础生成
```typescript
import { ComponentGenerator } from '@ldesign/generator'

const gen = new ComponentGenerator('./templates', './src')

// Vue 组件
await gen.generateVueComponent({
  name: 'MyButton',
  props: [{ name: 'type', type: 'string' }],
  withStyle: true
})

// React 组件
await gen.generateReactComponent({
  name: 'MyButton',
  props: [{ name: 'onClick', type: '() => void' }]
})
```

### 使用插件
```typescript
import { Generator, stylePlugin, testPlugin } from '@ldesign/generator'

const gen = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [stylePlugin, testPlugin]
})
```

### 批量生成
```typescript
import { BatchGenerator } from '@ldesign/generator'

const batchGen = new BatchGenerator(options)
const result = await batchGen.generateBatch([
  { name: 'Button', template: 'vue/component.ejs', data: {...} },
  { name: 'Input', template: 'vue/component.ejs', data: {...} }
], {
  parallel: true,
  maxConcurrency: 5
})
```

### 干运行
```typescript
import { DryRunGenerator } from '@ldesign/generator'

const dryGen = new DryRunGenerator(options)
const result = await dryGen.dryRunGenerate(template, data)
DryRunGenerator.displayResult(result, { showContent: true })
```

### 性能监控
```typescript
import { performanceMonitor } from '@ldesign/generator'

// 查看统计
const stats = performanceMonitor.getStats()
console.log(performanceMonitor.generateReport())

// 分析瓶颈
const analysis = performanceMonitor.analyzeBottlenecks()
console.log(analysis.recommendations)
```

### 缓存管理
```typescript
import { cacheManager } from '@ldesign/generator'

// 查看统计
const stats = cacheManager.getStats()
console.log(`命中率: ${stats.hitRate}`)

// 清空缓存
cacheManager.clearAll()

// 失效特定缓存
cacheManager.invalidate('template', 'vue/component.ejs')
```

### 日志系统
```typescript
import { logger, LogLevel } from '@ldesign/generator'

// 设置级别
logger.setLevel(LogLevel.DEBUG)

// 记录日志
logger.info('信息')
logger.warn('警告')
logger.error('错误', error)

// 搜索日志
const logs = await logger.searchLogs({ keyword: 'error' })

// 导出日志
await logger.exportLogs('logs.json', 'json')
```

### 模板验证
```typescript
import { validate, TemplateValidator } from '@ldesign/generator'

const result = validate(templateContent, 'ejs')

if (!result.valid) {
  console.log(TemplateValidator.formatResult(result))
}
```

### 历史和回滚
```typescript
import { historyManager, rollbackManager } from '@ldesign/generator'

// 查看历史
const recent = historyManager.getRecent(10)

// 回滚最近的操作
await rollbackManager.rollbackLast({
  backup: true,
  interactive: true
})

// 回滚指定操作
await rollbackManager.rollback(historyId)
```

---

## 🔧 配置示例

### ldesign.config.js
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
  
  // 模板目录
  templateDir: './templates',
  
  // 输出目录
  outputDir: './src',
  
  // 插件
  plugins: []
}
```

---

## 📁 模板列表

### Vue (7个)
- vue/component.ejs
- vue/component-tsx.ejs
- vue/page.ejs
- vue/composable.ejs
- vue/store.ejs
- vue/directive.ejs
- vue/plugin.ejs

### React (7个)
- react/component.ejs
- react/component-class.ejs
- react/page.ejs
- react/hook.ejs
- react/context.ejs
- react/hoc.ejs
- react/store.ejs

### Angular (6个)
- angular/component.ejs
- angular/service.ejs
- angular/module.ejs
- angular/directive.ejs
- angular/pipe.ejs
- angular/guard.ejs

### 通用 (6个)
- common/api.ejs
- common/types.ejs
- common/utils.ejs
- common/config.ejs
- common/test.ejs
- common/mock.ejs

**总计**: 26个专业模板

---

## 🎯 最佳实践

### 1. 使用干运行
```bash
# 先预览再生成
lgen c -n MyButton --dry-run
# 确认无误后再执行
lgen c -n MyButton
```

### 2. 启用日志
```typescript
import { logger, LogLevel } from '@ldesign/generator'

// 开发环境
logger.setLevel(LogLevel.DEBUG)

// 生产环境
logger.setLevel(LogLevel.ERROR)
logger.setFileEnabled(true)
```

### 3. 监控性能
```typescript
import { performanceMonitor } from '@ldesign/generator'

// 生成后查看性能
const stats = performanceMonitor.getStats()
console.log(`平均耗时: ${stats.averageDuration}ms`)
```

### 4. 验证模板
```typescript
import { validate } from '@ldesign/generator'

// 部署前验证所有模板
const result = validate(templateContent)
if (!result.valid) {
  process.exit(1)
}
```

### 5. 使用配置文件
```bash
# 创建配置文件
lgen init

# 之后的命令会自动使用配置
lgen c -n MyButton  # 使用配置中的默认设置
```

---

## 🐛 故障排除

### 问题：生成速度慢
**解决方案**:
```typescript
// 查看性能报告
import { performanceMonitor } from '@ldesign/generator'
console.log(performanceMonitor.generateReport())

// 查看缓存统计
import { cacheManager } from '@ldesign/generator'
console.log(cacheManager.getStats())
```

### 问题：模板错误
**解决方案**:
```typescript
// 验证模板
import { validate } from '@ldesign/generator'
const result = validate(templateContent)
console.log(TemplateValidator.formatResult(result))
```

### 问题：需要回滚
**解决方案**:
```bash
# 查看历史
lgen history list

# 回滚最近的操作
lgen rollback --last

# 或指定 ID
lgen rollback --id <history-id>
```

### 问题：内存占用高
**解决方案**:
```typescript
// 清空缓存
import { cacheManager } from '@ldesign/generator'
cacheManager.clearAll()

// 查看内存使用
import { performanceMonitor } from '@ldesign/generator'
const memory = performanceMonitor.monitorMemory()
console.log(memory.recommendation)
```

---

## 📞 获取帮助

### 命令行帮助
```bash
lgen --help
lgen component --help
lgen page --help
```

### 查看版本
```bash
lgen --version
```

### 查看配置
```bash
cat ldesign.config.js
```

### 查看日志
```bash
# 日志位置: ~/.ldesign/logs/
cat ~/.ldesign/logs/generator-2025-10-23.log
```

---

## 🔗 相关链接

- 📚 [完整文档](./README.md)
- 📝 [更新日志](./CHANGELOG.md)
- 🎯 [功能清单](./FEATURES.md)
- 📊 [实现总结](./IMPLEMENTATION_SUMMARY.md)
- 🎉 [最终总结](./FINAL_SUMMARY.md)

---

**版本**: v2.0.0  
**更新时间**: 2025年10月23日


