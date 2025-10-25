# Generator 故障排除指南

## 常见问题

### 1. 模板相关问题

#### Q: 模板未找到错误

**错误信息**:
```
TemplateError: 模板未找到: vue/component.ejs
```

**可能原因**:
- 模板文件不存在
- 模板路径配置错误
- 文件扩展名错误

**解决方案**:
```typescript
// 1. 检查模板文件是否存在
const fs = require('fs-extra')
const templatePath = './templates/vue/component.ejs'
console.log('模板存在:', await fs.pathExists(templatePath))

// 2. 检查配置
console.log('模板目录:', generator.options.templateDir)

// 3. 列出所有可用模板
const templates = await glob('./templates/**/*.ejs')
console.log('可用模板:', templates)
```

#### Q: 模板语法错误

**错误信息**:
```
TemplateError: 模板语法错误: Unexpected token
```

**解决方案**:
```typescript
// 使用验证器检查模板
import { validate } from '@ldesign/generator'

const result = validate(templateContent, 'ejs')

if (!result.valid) {
  result.issues.forEach(issue => {
    console.log(`行 ${issue.line}: ${issue.message}`)
  })
}
```

**常见语法错误**:
- 未闭合的标签: `<% if (condition) { %>` 缺少 `<% } %>`
- 括号不匹配: `<%= func( %>` 缺少闭合括号
- 变量未定义: 使用了未传入的变量

---

### 2. 文件系统问题

#### Q: 文件已存在错误

**错误信息**:
```
FileSystemError: 文件已存在: ./src/components/MyButton.vue
```

**解决方案**:

**方案1: 备份后覆盖**
```typescript
const writer = generator.getFileWriter()
await writer.backup('MyButton.vue')
await generator.generate(...)
```

**方案2: 生成到不同位置**
```typescript
await generator.generate(template, {
  ...data,
  outputFileName: 'MyButton-new.vue'
})
```

**方案3: 使用干运行模式检查**
```typescript
import { DryRunGenerator } from '@ldesign/generator'

const dryGen = new DryRunGenerator(options)
const result = await dryGen.dryRunGenerate(template, data)

if (result.files.some(f => f.action === 'overwrite')) {
  console.warn('将覆盖现有文件:', result.files)
}
```

#### Q: 权限被拒绝

**错误信息**:
```
FileSystemError: 权限不足
```

**解决方案**:
```bash
# 检查目录权限
ls -la ./src

# 修改权限（Unix/Linux/Mac）
chmod -R 755 ./src

# Windows: 以管理员身份运行
```

#### Q: 路径遍历错误

**错误信息**:
```
FileSystemError: 检测到路径遍历攻击尝试: ../../../etc/passwd
```

**解决方案**:
- 不要使用 `..` 在路径中
- 使用相对路径而非绝对路径
- 使用 `safeJoinPath` 函数

```typescript
import { safeJoinPath } from '@ldesign/generator/utils'

// 安全
const path = safeJoinPath(baseDir, 'components/MyButton.vue')

// 不安全（会抛出错误）
const path = safeJoinPath(baseDir, '../../../etc/passwd')
```

---

### 3. 配置问题

#### Q: 配置文件未找到

**错误信息**:
```
ConfigError: 配置文件未找到
```

**解决方案**:
```bash
# 运行初始化命令
lgen init

# 或手动创建配置文件
touch ldesign.config.js
```

#### Q: 配置解析失败

**错误信息**:
```
ConfigError: 配置文件解析失败: SyntaxError
```

**解决方案**:
```javascript
// 检查配置文件语法
export default {
  defaultLang: 'ts',  // ✅ 正确
  // defaultLang: ts,  // ❌ 错误：缺少引号
}
```

---

### 4. 插件问题

#### Q: 插件执行失败

**错误信息**:
```
PluginError: 插件 style-plugin 执行失败
```

**解决方案**:
```typescript
// 1. 检查插件配置
const plugin = generator.getPluginManager().getPlugin('style-plugin')
console.log('插件配置:', plugin?.config)

// 2. 禁用有问题的插件
const generator = new Generator({
  plugins: [] // 暂时不使用插件
})

// 3. 检查插件依赖
// 确保插件所需的数据都已提供
```

#### Q: 插件已注册错误

**错误信息**:
```
PluginError: 插件已注册: my-plugin
```

**解决方案**:
```typescript
// 检查是否重复注册
const pluginManager = generator.getPluginManager()
const stats = pluginManager.getStats()
console.log('已注册插件:', stats.plugins)

// 如果需要重新注册，先卸载
pluginManager.unload('my-plugin')
pluginManager.register(myPlugin)
```

---

### 5. 性能问题

#### Q: 生成速度慢

**症状**: 生成大量文件时非常慢

**解决方案**:

**1. 启用并行生成**:
```typescript
await batchGen.generateBatch(configs, {
  parallel: true,
  maxConcurrency: 10
})
```

**2. 预热缓存**:
```typescript
const engine = generator.getTemplateEngine()
await engine.warmupCache([
  'vue/component.ejs',
  'react/component.ejs'
])
```

**3. 监控性能**:
```typescript
import { performanceMonitor } from '@ldesign/generator'

const slowOps = performanceMonitor.getSlowOperations(1000)
console.log('慢操作:', slowOps)
```

#### Q: 内存占用高

**症状**: 生成大量文件时内存持续增长

**解决方案**:

**1. 清理缓存**:
```typescript
import { cacheManager } from '@ldesign/generator'

// 生成完成后清理
cacheManager.clearAll()
```

**2. 减少并发数**:
```typescript
batchGen.setMaxConcurrent(3) // 降低并发数
```

**3. 监控内存**:
```typescript
import { performanceMonitor } from '@ldesign/generator'

const memory = performanceMonitor.monitorMemory()
console.log('内存使用:', memory)

if (memory.percentage > 70) {
  console.warn('内存使用过高!')
  cacheManager.clearAll()
}
```

---

### 6. 验证问题

#### Q: 组件名称验证失败

**错误信息**:
```
ValidationError: 组件名称应该是 PascalCase 或 kebab-case 格式
```

**有效名称**:
- ✅ `MyButton` (PascalCase)
- ✅ `my-button` (kebab-case)
- ✅ `UserList`
- ✅ `user-list`

**无效名称**:
- ❌ `myButton` (camelCase，首字母应大写)
- ❌ `My_Button` (包含下划线)
- ❌ `123Button` (以数字开头)
- ❌ `My-button` (混合大小写)

**解决方案**:
```typescript
import { toPascalCase, toKebabCase } from '@ldesign/generator/utils'

// 自动转换
const validName = toPascalCase(userInput)
```

---

### 7. 批量生成问题

#### Q: 批量生成部分失败

**症状**: 某些文件生成失败，但没有中断整个流程

**解决方案**:

**1. 检查错误详情**:
```typescript
const result = await batchGen.generateBatch(configs, {
  continueOnError: true
})

result.errors.forEach(({ index, error }) => {
  console.error(`文件 ${index} 生成失败:`, error)
})
```

**2. 重试失败的任务**:
```typescript
const failedConfigs = result.errors.map(e => configs[e.index])

await batchGen.generateBatch(failedConfigs, {
  continueOnError: false // 这次不继续，立即失败
})
```

---

### 8. 缓存问题

#### Q: 缓存未生效

**症状**: 每次都重新编译模板

**解决方案**:

**1. 检查缓存是否启用**:
```typescript
import { cacheManager } from '@ldesign/generator'

const stats = cacheManager.getStats()
console.log('缓存启用:', stats.enabled)
console.log('缓存统计:', stats)
```

**2. 检查缓存命中率**:
```typescript
const stats = cacheManager.getStats()
console.log('命中率:', stats.hitRate)

// 如果命中率很低，可能需要预热
```

**3. 启用缓存**:
```typescript
if (!stats.enabled) {
  cacheManager.setEnabled(true)
}
```

#### Q: 缓存数据错误

**症状**: 修改模板后，生成的还是旧内容

**解决方案**:
```typescript
// 清除特定模板的缓存
const engine = generator.getTemplateEngine()
engine.clearTemplateCache('vue/component.ejs')

// 或清除所有缓存
engine.clearAllCache()
cacheManager.clearAll()
```

---

### 9. 国际化问题

#### Q: 显示的不是期望的语言

**解决方案**:
```typescript
import { i18n } from '@ldesign/generator'

// 检查当前语言
console.log('当前语言:', i18n.getLocale())

// 设置语言
i18n.setLocale('en-US')

// 检查支持的语言
console.log('支持的语言:', i18n.getSupportedLocales())
```

---

### 10. 历史/回滚问题

#### Q: 回滚失败

**错误信息**:
```
文件已被修改，跳过: ./src/components/MyButton.vue
```

**解决方案**:
```typescript
// 使用 force 选项强制回滚
await rollbackManager.rollback(historyId, {
  force: true,  // 忽略文件修改检查
  backup: true  // 仍然创建备份
})
```

#### Q: 历史记录丢失

**解决方案**:
```typescript
// 历史记录保存在用户目录
const historyPath = '~/.ldesign/history/generator-history.json'

// 如果丢失，可以导入备份
await historyManager.import('./history-backup.json')
```

---

## 调试技巧

### 1. 启用详细日志

```typescript
import { logger, LogLevel } from '@ldesign/generator'

// 设置为 DEBUG 级别
logger.setLevel(LogLevel.DEBUG)

// 执行操作
await generator.generate(...)

// 查看日志文件
const logFile = logger.getLogFile()
console.log('日志文件:', logFile)
```

### 2. 干运行模式

```typescript
import { DryRunGenerator } from '@ldesign/generator'

const dryGen = new DryRunGenerator(options)
const result = await dryGen.dryRunGenerate(template, data)

// 查看将要生成的文件
DryRunGenerator.displayResult(result, { showContent: true })
```

### 3. 预览模式

```typescript
import { PreviewGenerator } from '@ldesign/generator'

const previewGen = new PreviewGenerator(options)
const result = await previewGen.generatePreview(template, data, {
  showLineNumbers: true,
  showDiff: true
})

// 检查生成的内容
console.log(result.content)
```

### 4. 性能分析

```typescript
import { performanceMonitor } from '@ldesign/generator'

// 执行操作
await generator.generate(...)

// 查看性能报告
const report = performanceMonitor.generateReport()
console.log(report)

// 分析瓶颈
const analysis = performanceMonitor.analyzeBottlenecks()
console.log('优化建议:', analysis.recommendations)
```

### 5. 检查队列状态

```typescript
import { createTaskQueue } from '@ldesign/generator'

const queue = createTaskQueue()
queue.displayStatus()

// 查看失败的任务
const failed = queue.getFailedTasks()
console.log('失败的任务:', failed)
```

---

## 诊断命令

### 系统信息

```bash
# Node 版本
node --version

# npm 版本
npm --version

# Generator 版本
lgen --version

# 系统信息
node -p "os.platform(), os.arch(), os.cpus().length"
```

### 清理操作

```bash
# 清理缓存
rm -rf ~/.ldesign/cache

# 清理日志
rm -rf ~/.ldesign/logs

# 清理历史
rm -rf ~/.ldesign/history

# 重新安装
rm -rf node_modules
npm install
```

---

## 错误代码参考

| 代码 | 名称 | 描述 | 解决方案 |
|------|------|------|----------|
| 2000 | FILE_NOT_FOUND | 文件未找到 | 检查文件路径 |
| 2001 | FILE_ALREADY_EXISTS | 文件已存在 | 使用 --force 或更改文件名 |
| 2007 | PATH_TRAVERSAL_ATTEMPT | 路径遍历尝试 | 不使用 .. 在路径中 |
| 3000 | TEMPLATE_NOT_FOUND | 模板未找到 | 检查模板路径和名称 |
| 3001 | TEMPLATE_SYNTAX_ERROR | 模板语法错误 | 验证模板语法 |
| 4001 | CONFIG_PARSE_ERROR | 配置解析失败 | 检查配置文件语法 |
| 5002 | PLUGIN_EXECUTION_ERROR | 插件执行失败 | 检查插件代码 |
| 9001 | INPUT_VALIDATION_ERROR | 输入验证失败 | 检查输入格式 |

---

## 获取帮助

如果以上方法都无法解决问题：

1. **查看文档**: [完整文档](https://ldesign.dev/generator)
2. **搜索已知问题**: [GitHub Issues](https://github.com/ldesign/generator/issues)
3. **提问**: [GitHub Discussions](https://github.com/ldesign/generator/discussions)
4. **报告 Bug**: [新建 Issue](https://github.com/ldesign/generator/issues/new)

---

## 提交 Bug 报告

好的 Bug 报告应包含：

1. **环境信息**:
   - Node 版本
   - npm/pnpm/yarn 版本
   - 操作系统
   - Generator 版本

2. **重现步骤**:
   - 执行的命令或代码
   - 使用的配置
   - 输入的数据

3. **预期行为**: 你期望发生什么

4. **实际行为**: 实际发生了什么

5. **错误信息**: 完整的错误堆栈

6. **日志文件**: 如果可能，附上日志文件

**示例**:

```markdown
## 环境
- Node: v18.17.0
- npm: 9.6.7
- OS: macOS 13.4
- Generator: 2.0.0

## 重现步骤
1. 运行 `lgen c -t vue -n MyButton`
2. 选择 scss 样式类型
3. 选择生成测试文件

## 预期
生成组件、样式、测试三个文件

## 实际
只生成了组件文件，样式和测试未生成

## 错误信息
\`\`\`
PluginError: 插件 style-plugin 执行失败
  at PluginManager.executeAfterGenerate
  ...
\`\`\`

## 日志
（附上 ~/.ldesign/logs/generator-2024-01-01.log 的相关内容）
```

---

## 性能优化清单

如果遇到性能问题，按以下清单检查：

- [ ] 启用缓存
- [ ] 预热常用模板
- [ ] 使用并行生成（批量操作）
- [ ] 增加并发数（基于CPU核心数）
- [ ] 清理旧缓存和日志
- [ ] 检查模板复杂度
- [ ] 减少插件数量
- [ ] 监控内存使用
- [ ] 使用性能分析工具

---

## 常见误区

### 误区1: 过度使用插件

❌ **不好**: 启用所有插件
```typescript
plugins: [stylePlugin, testPlugin, docPlugin, typescriptPlugin, eslintPlugin, prettierPlugin, ...]
```

✅ **好**: 只启用需要的插件
```typescript
plugins: [stylePlugin, testPlugin]
```

### 误区2: 忽略错误

❌ **不好**: 忽略错误
```typescript
try {
  await generator.generate(...)
} catch {}
```

✅ **好**: 正确处理错误
```typescript
try {
  await generator.generate(...)
} catch (error) {
  if (error instanceof GeneratorError) {
    console.error(error.message)
    if (error.suggestion) {
      console.log('建议:', error.suggestion)
    }
  }
  throw error
}
```

### 误区3: 硬编码配置

❌ **不好**: 硬编码
```typescript
const outputDir = './src/components'
const lang = 'ts'
```

✅ **好**: 使用配置
```typescript
const config = await loadConfig()
const outputDir = config.outputDir || './src/components'
const lang = config.defaultLang || 'ts'
```

---

## 快速诊断脚本

保存为 `diagnose.js`:

```javascript
import {
  cacheManager,
  performanceMonitor,
  historyManager,
  logger
} from '@ldesign/generator'

async function diagnose() {
  console.log('🔍 Generator 诊断报告\n')

  // 缓存状态
  console.log('📦 缓存状态:')
  const cacheStats = cacheManager.getStats()
  console.log('  启用:', cacheStats.enabled)
  console.log('  命中率:', cacheStats.hitRate)
  console.log()

  // 性能统计
  console.log('⚡ 性能统计:')
  const perfStats = performanceMonitor.getStats()
  console.log('  总操作:', perfStats.totalOperations)
  console.log('  平均耗时:', perfStats.averageDuration.toFixed(2), 'ms')
  console.log()

  // 历史统计
  console.log('📜 历史统计:')
  const historyStats = historyManager.getStats()
  console.log('  总记录:', historyStats.total)
  console.log('  成功率:', historyStats.successRate)
  console.log()

  // 日志位置
  console.log('📝 日志文件:')
  const logFile = logger.getLogFile()
  console.log('  ', logFile)
  console.log()

  // 建议
  console.log('💡 优化建议:')
  const analysis = performanceMonitor.analyzeBottlenecks()
  analysis.recommendations.forEach(r => console.log('  -', r))
}

diagnose()
```

运行诊断：
```bash
node diagnose.js
```

---

## 联系支持

如果问题仍未解决：

- 📧 Email: support@ldesign.dev
- 💬 Discord: [加入我们的Discord](https://discord.gg/ldesign)
- 🐦 Twitter: [@ldesign_dev](https://twitter.com/ldesign_dev)

---

**最后更新**: 2024-01-01  
**文档版本**: 1.0.0

