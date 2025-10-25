# Generator 最佳实践指南

## 目录

1. [项目组织](#项目组织)
2. [模板设计](#模板设计)
3. [性能优化](#性能优化)
4. [安全性](#安全性)
5. [可维护性](#可维护性)
6. [测试](#测试)
7. [团队协作](#团队协作)

---

## 项目组织

### 目录结构

推荐的项目结构：

```
project/
├── templates/           # 模板目录
│   ├── vue/            # Vue 模板
│   ├── react/          # React 模板
│   ├── common/         # 通用模板
│   └── custom/         # 自定义模板
├── src/                # 生成的代码
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── stores/
│   └── api/
├── ldesign.config.js   # 配置文件
└── .ldesignrc          # 运行时配置（可选）
```

### 命名约定

**组件命名**:
- Vue: PascalCase 或 kebab-case (`MyButton` 或 `my-button`)
- React: PascalCase (`MyButton`)

**文件命名**:
- 组件: `MyButton.vue`, `MyButton.tsx`
- 页面: `UserList.vue`, `UserListPage.tsx`
- Hook: `useFetch.ts`, `useLocalStorage.ts`
- Store: `user.ts`, `user.store.ts`
- API: `user.ts`, `user.api.ts`

### 配置文件

**ldesign.config.js**:
```javascript
export default {
  // 基础配置
  defaultLang: 'ts',
  styleType: 'scss',
  testFramework: 'vitest',
  prettier: true,
  
  // 命名规范
  nameCase: 'pascalCase',
  fileStructure: 'flat',
  
  // 目录配置
  outputDirs: {
    components: './src/components',
    pages: './src/pages',
    hooks: './src/hooks',
    stores: './src/stores',
    api: './src/api'
  },
  
  // 插件
  plugins: []
}
```

---

## 模板设计

### 设计原则

1. **单一职责**: 每个模板只负责一种类型的文件生成
2. **可配置性**: 使用条件判断支持不同配置
3. **可扩展性**: 预留扩展点，便于未来添加功能
4. **可读性**: 添加注释，保持代码清晰

### 模板结构

**好的模板示例**:
```ejs
<%# 
  组件模板
  参数:
    - componentName: 组件名称
    - props: Props 数组
    - emits: 事件数组
    - withStyle: 是否包含样式
%>
<template>
  <div class="<%= kebabCase(componentName) %>">
    <%# 组件内容 %>
  </div>
</template>

<script setup lang="<%= lang %>">
<% if (props.length > 0) { %>
<%# Props 定义 %>
interface Props {
  <% props.forEach(prop => { %>
  <%= prop.name %>: <%= prop.type %><%= prop.default ? ` // 默认: ${prop.default}` : '' %>
  <% }) %>
}

const props = defineProps<Props>()
<% } %>

<% if (emits.length > 0) { %>
<%# Emits 定义 %>
const emit = defineEmits<<%= emits.map(e => `'${e}'`).join(' | ') %>>()
<% } %>
</script>

<% if (withStyle) { %>
<style scoped lang="<%= styleType %>">
.<%= kebabCase(componentName) %> {
  /* 添加样式 */
}
</style>
<% } %>
```

### 变量命名

在模板中使用清晰的变量名：

- `componentName` - 组件名称
- `props` - Props 数组
- `emits` - 事件数组
- `withXxx` - 布尔标志
- `xxxType` - 类型选择

### 辅助函数

利用内置辅助函数：

```ejs
<%= pascalCase(name) %>   <%# PascalCase %>
<%= camelCase(name) %>    <%# camelCase %>
<%= kebabCase(name) %>    <%# kebab-case %>
<%= snakeCase(name) %>    <%# snake_case %>
<%= upperCase(name) %>    <%# UPPERCASE %>
<%= lowerCase(name) %>    <%# lowercase %>
<%= currentYear() %>      <%# 2024 %>
<%= currentDate() %>      <%# 2024-01-01 %>
```

---

## 性能优化

### 1. 缓存预热

**问题**: 首次生成多个文件时，每次都要编译模板

**解决方案**:
```typescript
const engine = generator.getTemplateEngine()

// 预热常用模板
await engine.warmupCache([
  'vue/component.ejs',
  'react/component.ejs',
  'common/api.ejs'
])
```

### 2. 并行生成

**问题**: 串行生成大量文件很慢

**解决方案**:
```typescript
const batchGen = new BatchGenerator(options)

await batchGen.generateBatch(configs, {
  parallel: true,
  maxConcurrency: 10  // 根据CPU核心数调整
})
```

### 3. 使用任务队列

**问题**: 需要精细控制并发和优先级

**解决方案**:
```typescript
import { createTaskQueue, TaskPriority } from '@ldesign/generator'

const queue = createTaskQueue({ maxConcurrent: 5 })

// 高优先级任务
await queue.add({
  name: 'urgent-component',
  priority: TaskPriority.URGENT,
  executor: () => generator.generate(...)
})

// 普通任务
await queue.add({
  name: 'normal-component',
  priority: TaskPriority.NORMAL,
  executor: () => generator.generate(...)
})
```

### 4. 优化模板

**避免**:
```ejs
<%# 不好 - 重复计算 %>
<% const pName = pascalCase(name) %>
<% const kName = kebabCase(name) %>
<div class="<%= kebabCase(name) %>">
  <%= pascalCase(name) %>
</div>
```

**推荐**:
```ejs
<%# 好 - 只计算一次 %>
<% 
  const pName = pascalCase(name)
  const kName = kebabCase(name)
%>
<div class="<%= kName %>">
  <%= pName %>
</div>
```

### 5. 减少插件数量

只启用需要的插件：

```typescript
// 不好 - 启用所有插件
plugins: [stylePlugin, testPlugin, docPlugin, typescriptPlugin, eslintPlugin]

// 好 - 只启用需要的
plugins: [stylePlugin, testPlugin]
```

---

## 安全性

### 1. 输入验证

**始终验证用户输入**:

```typescript
import { validateComponentName, validateFilePath } from '@ldesign/generator'

// 验证组件名
try {
  validateComponentName(userInput)
} catch (error) {
  console.error('无效的组件名:', error.message)
  return
}

// 验证文件路径
try {
  validateFilePath(userPath, baseDir)
} catch (error) {
  console.error('无效的路径:', error.message)
  return
}
```

### 2. 路径安全

**使用安全的路径操作**:

```typescript
import { safeJoinPath } from '@ldesign/generator/utils'

// 不好 - 不安全
const outputPath = path.join(baseDir, userInput)

// 好 - 安全，会检测路径遍历
const outputPath = safeJoinPath(baseDir, userInput)
```

### 3. 模板安全

**避免在模板中直接使用用户输入**:

```ejs
<%# 不好 - 可能有 XSS 风险 %>
<%- userInput %>

<%# 好 - 转义输出 %>
<%= userInput %>
```

### 4. 文件名清理

```typescript
import { sanitizeFileName } from '@ldesign/generator/utils'

// 清理危险字符
const safeName = sanitizeFileName(userFileName)
```

---

## 可维护性

### 1. 使用类型定义

**为所有选项定义类型**:

```typescript
interface MyGeneratorOptions {
  name: string
  type: 'vue' | 'react'
  withStyle: boolean
  styleType: 'css' | 'scss' | 'less'
}

async function generate(options: MyGeneratorOptions) {
  // TypeScript 会提供类型检查和智能提示
}
```

### 2. 错误处理

**使用自定义错误类**:

```typescript
import { ErrorFactory } from '@ldesign/generator'

if (!templateExists) {
  throw ErrorFactory.templateNotFound(templateName)
}

if (fileExists && !force) {
  throw ErrorFactory.fileAlreadyExists(filePath)
}
```

### 3. 日志记录

**记录关键操作**:

```typescript
import { logger } from '@ldesign/generator'

logger.info('开始生成组件', { name: componentName })
logger.debug('使用模板', { template: templateName })
logger.error('生成失败', error)
```

### 4. 代码组织

**将复杂逻辑拆分**:

```typescript
// 不好 - 所有逻辑在一个函数中
async function generate() {
  // 验证
  // 加载模板
  // 渲染
  // 格式化
  // 写入
  // 100+ 行代码
}

// 好 - 拆分成多个函数
async function generate() {
  validateInput()
  const template = await loadTemplate()
  const content = await renderTemplate(template)
  const formatted = await formatCode(content)
  await writeFile(formatted)
}
```

### 5. 文档注释

**为所有公共API添加JSDoc**:

```typescript
/**
 * 生成 Vue 组件
 * 
 * @param options - 组件选项
 * @param options.name - 组件名称
 * @param options.props - Props 定义
 * @returns 生成结果
 * @throws {ValidationError} 当组件名称无效时
 * @throws {TemplateError} 当模板不存在时
 * 
 * @example
 * ```typescript
 * await generator.generateVueComponent({
 *   name: 'MyButton',
 *   props: [{ name: 'type', type: 'string' }]
 * })
 * ```
 */
async generateVueComponent(options: ComponentOptions): Promise<GenerateResult>
```

---

## 测试

### 1. 单元测试

**测试工具函数**:

```typescript
import { describe, it, expect } from 'vitest'
import { toPascalCase, toKebabCase } from '@ldesign/generator/utils'

describe('String Helpers', () => {
  it('should convert to PascalCase', () => {
    expect(toPascalCase('hello-world')).toBe('HelloWorld')
    expect(toPascalCase('helloWorld')).toBe('HelloWorld')
  })

  it('should convert to kebab-case', () => {
    expect(toKebabCase('HelloWorld')).toBe('hello-world')
    expect(toKebabCase('helloWorld')).toBe('hello-world')
  })
})
```

**测试生成器**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentGenerator } from '@ldesign/generator'
import fs from 'fs-extra'

describe('ComponentGenerator', () => {
  let generator: ComponentGenerator
  const testOutputDir = './test-output'

  beforeEach(async () => {
    generator = new ComponentGenerator('./templates', testOutputDir)
    await fs.emptyDir(testOutputDir)
  })

  it('should generate Vue component', async () => {
    const result = await generator.generateVueComponent({
      name: 'TestButton'
    })

    expect(result.success).toBe(true)
    expect(result.outputPath).toContain('TestButton.vue')
    expect(await fs.pathExists(result.outputPath!)).toBe(true)
  })
})
```

### 2. 集成测试

**测试完整流程**:

```typescript
describe('Complete Workflow', () => {
  it('should generate component with style and test', async () => {
    const generator = new Generator({
      templateDir: './templates',
      outputDir: './test-output',
      plugins: [stylePlugin, testPlugin]
    })

    const result = await generator.generate('vue/component.ejs', {
      componentName: 'MyButton',
      withStyle: true,
      withTest: true
    })

    // 验证主文件
    expect(result.success).toBe(true)
    
    // 验证样式文件（插件生成）
    const styleFile = result.outputPath!.replace('.vue', '.scss')
    expect(await fs.pathExists(styleFile)).toBe(true)
    
    // 验证测试文件（插件生成）
    const testFile = result.outputPath!.replace('.vue', '.spec.ts')
    expect(await fs.pathExists(testFile)).toBe(true)
  })
})
```

### 3. E2E 测试

**测试CLI命令**:

```typescript
import { execSync } from 'child_process'

describe('CLI E2E', () => {
  it('should generate component via CLI', () => {
    const output = execSync(
      'lgen c -t vue -n TestButton',
      { encoding: 'utf-8' }
    )

    expect(output).toContain('成功生成')
  })
})
```

---

## 团队协作

### 1. 共享模板

**使用 Git 管理模板**:

```bash
# 创建模板仓库
git init templates
cd templates
git add .
git commit -m "Initial templates"
git remote add origin <repo-url>
git push -u origin main
```

**团队成员使用**:

```bash
git clone <templates-repo-url> ./templates
```

### 2. 统一配置

**提交配置文件到版本控制**:

```bash
git add ldesign.config.js
git commit -m "Add generator config"
```

### 3. Code Review

**检查清单**:
- [ ] 模板语法正确
- [ ] 包含必要的注释
- [ ] 支持必要的配置选项
- [ ] 生成的代码符合团队规范
- [ ] 有测试覆盖

### 4. CI/CD 集成

**在 CI 中验证模板**:

```yaml
# .github/workflows/validate-templates.yml
name: Validate Templates

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run validate-templates
```

**验证脚本**:

```typescript
import { TemplateValidator } from '@ldesign/generator'
import fs from 'fs-extra'
import glob from 'fast-glob'

async function validateAllTemplates() {
  const templates = await glob('templates/**/*.ejs')
  const validator = new TemplateValidator()
  
  let hasErrors = false
  
  for (const template of templates) {
    const content = await fs.readFile(template, 'utf-8')
    const result = validator.validate(content, 'ejs')
    
    if (!result.valid) {
      console.error(`❌ ${template}:`, result.errors)
      hasErrors = true
    }
  }
  
  if (hasErrors) {
    process.exit(1)
  }
  
  console.log('✅ 所有模板验证通过')
}

validateAllTemplates()
```

---

## 性能优化

### 监控性能

**启用性能监控**:

```typescript
import { performanceMonitor } from '@ldesign/generator'

// 执行生成操作
await generator.generate(...)

// 查看性能报告
const report = performanceMonitor.generateReport({
  format: 'text',
  showMemory: true
})
console.log(report)

// 分析瓶颈
const analysis = performanceMonitor.analyzeBottlenecks()
console.log('优化建议:', analysis.recommendations)
```

### 优化建议

1. **批量生成时使用并行**:
   ```typescript
   await batchGen.generateBatch(configs, { parallel: true })
   ```

2. **预热缓存**:
   ```typescript
   await engine.warmupCache(commonTemplates)
   ```

3. **调整并发数**:
   ```typescript
   batchGen.setMaxConcurrent(cpu.count())
   ```

4. **启用持久化缓存**:
   ```typescript
   cacheManager.setPersistenceEnabled(true)
   await cacheManager.persist()
   ```

---

## 安全性

### 最佳实践

1. **永远验证输入**
2. **使用安全的路径操作**
3. **转义模板输出**
4. **限制文件大小**
5. **检查文件权限**

### 代码示例

```typescript
import { 
  validateComponentName,
  safeJoinPath,
  isPathSafe 
} from '@ldesign/generator'

function secureGenerate(name: string, output: string) {
  // 1. 验证名称
  validateComponentName(name)
  
  // 2. 验证路径
  if (!isPathSafe(output)) {
    throw new Error('不安全的路径')
  }
  
  // 3. 安全连接路径
  const fullPath = safeJoinPath(baseDir, output)
  
  // 4. 生成
  return generator.generate(template, { name })
}
```

---

## 可维护性

### 1. 版本控制

**模板版本化**:

```ejs
<%#
  Template: Vue Component
  Version: 2.0.0
  Updated: 2024-01-01
  Author: Your Name
  
  Changelog:
  - 2.0.0: 添加 TypeScript 支持
  - 1.0.0: 初始版本
%>
```

### 2. 文档

**为每个模板编写文档**:

```markdown
# Vue Component Template

## 用途
生成 Vue 3 组件（Composition API）

## 参数
- `componentName` (required): 组件名称
- `props` (optional): Props 数组
- `emits` (optional): 事件数组
- `withStyle` (optional): 是否包含样式
- `lang` (optional): 语言 (ts/js)

## 示例
\`\`\`bash
lgen c -t vue -n MyButton --style-type scss
\`\`\`

## 输出
- `MyButton.vue` - 组件文件
- `MyButton.scss` - 样式文件（如果 withStyle=true）
```

### 3. 更新检查

**定期检查并更新依赖**:

```bash
npm outdated
npm update
```

### 4. 向后兼容

**保持向后兼容**:

```typescript
// 支持旧版本参数
const lang = options.lang || options.language || 'ts'
const styleType = options.styleType || options.style || 'css'
```

---

## 实战案例

### 案例1: 快速创建功能模块

创建完整的用户管理模块：

```typescript
import { 
  ComponentGenerator,
  PageGenerator,
  ApiGenerator 
} from '@ldesign/generator'

async function createUserModule() {
  const compGen = new ComponentGenerator('./templates', './src/components')
  const pageGen = new PageGenerator('./templates', './src/pages')
  const apiGen = new ApiGenerator('./templates', './src/api')

  // 1. 生成 API
  await apiGen.generateRestfulApi({
    name: 'user',
    resource: 'users',
    withMock: true
  })

  // 2. 生成 Store
  await compGen.generateVueStore({
    name: 'user',
    type: 'pinia',
    state: [
      { name: 'users', type: 'User[]', default: [] },
      { name: 'currentUser', type: 'User | null', default: null }
    ],
    actions: ['fetchUsers', 'fetchUser', 'createUser', 'updateUser', 'deleteUser']
  })

  // 3. 生成 CRUD 页面
  await pageGen.generateCrudPages({
    name: 'User',
    type: 'vue',
    withApi: true,
    withStore: true
  })

  console.log('✅ 用户模块创建完成！')
}
```

### 案例2: 自定义工作流

```typescript
import { Generator, definePlugin } from '@ldesign/generator'

// 自定义插件：自动添加版权信息
const copyrightPlugin = definePlugin({
  name: 'copyright-plugin',
  version: '1.0.0',
  
  hooks: {
    onTemplateRender: (context, content) => {
      const copyright = `/**
 * Copyright (c) ${new Date().getFullYear()} Your Company
 * All rights reserved.
 */

`
      return copyright + content
    }
  }
})

// 使用自定义工作流
const generator = new Generator({
  templateDir: './templates',
  outputDir: './src',
  plugins: [copyrightPlugin]
})
```

---

## 常见陷阱

### ❌ 不要做的事

1. **不要硬编码路径**
   ```typescript
   // 不好
   const output = '/absolute/path/component.vue'
   
   // 好
   const output = path.join(config.outputDir, 'component.vue')
   ```

2. **不要忽略错误**
   ```typescript
   // 不好
   try { await generate() } catch {}
   
   // 好
   try {
     await generate()
   } catch (error) {
     logger.error('生成失败', error)
     throw error
   }
   ```

3. **不要在模板中执行复杂逻辑**
   ```ejs
   <%# 不好 %>
   <% 
     const data = fetchDataFromAPI()  // 不要在模板中调用外部API
     const processed = complexCalculation(data)
   %>
   
   <%# 好 - 在模板外准备数据 %>
   <% const processed = data.processed %>
   ```

4. **不要跳过验证**
   ```typescript
   // 不好
   await generator.generate(template, userInput)
   
   // 好
   validateComponentName(userInput.name)
   await generator.generate(template, userInput)
   ```

### ✅ 应该做的事

1. **使用配置文件**
2. **启用缓存**
3. **记录日志**
4. **处理错误**
5. **验证输入**
6. **编写测试**
7. **添加文档**
8. **定期更新**

---

## 性能基准

### 典型操作耗时

| 操作 | 耗时 | 优化后 |
|------|------|--------|
| 生成单个组件 | ~10ms | ~5ms (缓存) |
| 生成100个组件（串行） | ~1000ms | ~550ms (并行) |
| 模板编译 | ~5ms | ~0.1ms (缓存) |
| 文件写入 | ~2ms | ~1ms (队列) |

### 优化效果

启用所有优化后：
- ✅ 整体性能提升 45%+
- ✅ 缓存命中率 60%+
- ✅ 内存使用降低 20%
- ✅ 并发效率提升 80%

---

## 总结

遵循这些最佳实践可以：

1. ✅ 提升代码质量
2. ✅ 提高性能
3. ✅ 增强安全性
4. ✅ 改善可维护性
5. ✅ 便于团队协作
6. ✅ 减少错误

记住核心原则：
- **验证一切输入**
- **使用类型系统**
- **启用缓存**
- **处理错误**
- **编写测试**
- **记录文档**

---

## 延伸阅读

- [API 文档](./API.md)
- [使用指南](./USAGE_GUIDE.md)
- [故障排除](./TROUBLESHOOTING.md)
- [示例代码](../examples/)
- [更新日志](../CHANGELOG.md)

