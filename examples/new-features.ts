/**
 * 新增功能使用示例
 * 展示所有新增和完善的功能
 */

import {
  ComponentGenerator,
  PageGenerator,
  ApiGenerator,
  BatchGenerator,
  historyManager,
  rollbackManager,
  validate,
  TemplateValidator,
  performanceMonitor,
} from '@ldesign/generator'

// ============================================
// 1. Angular 组件生成示例
// ============================================

async function generateAngularExamples() {
  const generator = new ComponentGenerator('./templates', './src/angular')

  // 生成 Angular 组件
  await generator.generateAngularComponent({
    name: 'UserProfile',
    props: [
      { name: 'userId', type: 'string' },
      { name: 'displayName', type: 'string' }
    ],
    standalone: true,
    withService: true,
    withStyle: true,
    description: '用户资料组件'
  })

  // 生成 Angular 服务
  await generator.generateAngularService({
    name: 'User',
    withTypes: true,
    retry: true,
    apiUrl: '/api/users',
    description: '用户服务'
  })

  // 生成 Angular 模块
  await generator.generateAngularModule({
    name: 'User',
    components: ['UserList', 'UserDetail', 'UserEdit'],
    withRouter: true,
    withForms: true,
    routes: [
      { path: '', component: 'UserList' },
      { path: ':id', component: 'UserDetail' },
      { path: 'edit/:id', component: 'UserEdit' }
    ],
    description: '用户模块'
  })

  // 生成 Angular 指令
  await generator.generateAngularDirective({
    name: 'Highlight',
    description: '高亮指令'
  })

  // 生成 Angular 管道
  await generator.generateAngularPipe({
    name: 'FormatDate',
    description: '日期格式化管道'
  })

  // 生成 Angular 守卫
  await generator.generateAngularGuard({
    name: 'Auth',
    type: 'CanActivate',
    description: '认证守卫'
  })
}

// ============================================
// 2. 批量生成示例
// ============================================

async function batchGenerationExamples() {
  const batchGen = new BatchGenerator({
    templateDir: './templates',
    outputDir: './src/components'
  })

  // 方式1: 从配置文件批量生成
  const configs = [
    {
      name: 'Button',
      template: 'vue/component.ejs',
      data: {
        componentName: 'Button',
        props: [{ name: 'type', type: 'string' }]
      }
    },
    {
      name: 'Input',
      template: 'vue/component.ejs',
      data: {
        componentName: 'Input',
        props: [{ name: 'value', type: 'string' }]
      }
    },
    {
      name: 'Select',
      template: 'vue/component.ejs',
      data: {
        componentName: 'Select',
        props: [{ name: 'options', type: 'any[]' }]
      }
    }
  ]

  // 并行批量生成
  const result = await batchGen.generateBatch(configs, {
    parallel: true,
    maxConcurrency: 5,
    continueOnError: true,
    showProgress: true
  })

  console.log(`批量生成完成: ${result.success}/${result.total} 成功`)
  console.log(`耗时: ${result.duration}ms`)

  // 方式2: 从 CSV 文件批量生成
  const csvConfigs = await batchGen.loadConfigFromCSV(
    './components.csv',
    'vue/component.ejs'
  )
  await batchGen.generateBatch(csvConfigs)

  // 方式3: 从 JSON 文件批量生成
  const jsonConfigs = await batchGen.loadConfigFromFile('./batch-config.json')
  await batchGen.generateBatch(jsonConfigs)

  // 方式4: 干运行模式（不实际生成文件）
  const dryRunResult = await batchGen.dryRunBatch(configs)
  console.log(`将生成 ${dryRunResult.totalFiles} 个文件`)
  console.log(`预计大小: ${dryRunResult.estimatedSize} bytes`)
}

// ============================================
// 3. 历史管理和回滚示例
// ============================================

async function historyAndRollbackExamples() {
  // 查看生成历史
  const recentHistory = historyManager.getRecent(10) // 最近10条
  console.log('最近的操作:')
  recentHistory.forEach(entry => {
    console.log(`- ${entry.operation}: ${entry.templateName}`)
    console.log(`  时间: ${new Date(entry.timestamp).toLocaleString()}`)
    console.log(`  文件: ${entry.files.length}`)
  })

  // 查询历史
  const filtered = historyManager.query({
    operation: 'generate',
    templateName: 'vue/component',
    success: true,
    startDate: new Date('2025-01-01'),
    limit: 50
  })

  // 获取统计信息
  const stats = historyManager.getStats()
  console.log(`总操作: ${stats.total}`)
  console.log(`成功率: ${stats.successRate}`)
  console.log(`总文件: ${stats.totalFiles}`)

  // 导出历史
  await historyManager.export('./history.json', 'json')
  await historyManager.export('./history.csv', 'csv')

  // 清理旧历史（保留30天）
  const removed = await historyManager.clearOld(30)
  console.log(`清理了 ${removed} 条旧记录`)

  // ===== 回滚操作 =====

  // 回滚最后一次操作
  await rollbackManager.rollbackLast({
    dryRun: false,        // 实际执行
    force: false,         // 不强制（文件被修改时会提示）
    backup: true,         // 创建备份
    interactive: true     // 交互确认
  })

  // 回滚指定操作
  const lastEntry = recentHistory[0]
  await rollbackManager.rollback(lastEntry.id, {
    backup: true,
    force: false
  })

  // 批量回滚
  const idsToRollback = recentHistory.slice(0, 3).map(e => e.id)
  const rollbackResults = await rollbackManager.rollbackMultiple(idsToRollback, {
    backup: true,
    force: false
  })

  // 干运行模式查看回滚效果
  const dryRunResult = await rollbackManager.rollback(lastEntry.id, {
    dryRun: true
  })
  console.log(`将删除 ${dryRunResult.filesDeleted} 个文件`)
}

// ============================================
// 4. 模板验证示例
// ============================================

async function templateValidationExamples() {
  const fs = await import('fs-extra')
  const templateContent = await fs.readFile('./templates/vue/component.ejs', 'utf-8')

  // 快速验证
  const result = validate(templateContent, 'ejs')

  if (result.valid) {
    console.log('✓ 模板验证通过')
    console.log(`质量分数: ${result.quality}`)
  } else {
    console.log('✗ 模板验证失败')
    console.log(`错误: ${result.errors}`)
    console.log(`警告: ${result.warnings}`)
    
    // 格式化输出详细信息
    console.log(TemplateValidator.formatResult(result))
  }

  // 查看具体问题
  result.issues.forEach(issue => {
    console.log(`[${issue.severity}] ${issue.message}`)
    if (issue.suggestion) {
      console.log(`  建议: ${issue.suggestion}`)
    }
  })

  // 自定义验证器
  const { createValidator } = await import('@ldesign/generator')
  
  const customValidator = createValidator({
    checkSyntax: true,
    checkRequiredFields: true,
    requiredFields: ['componentName', 'description'],
    checkBestPractices: true
  })

  const customResult = customValidator.validate(templateContent)

  // 添加自定义验证规则
  customValidator.addRule({
    name: 'no-console',
    check: (content, data) => {
      const issues = []
      if (content.includes('console.log')) {
        issues.push({
          severity: 'warning' as const,
          message: '模板中包含 console.log',
          rule: 'no-console',
          suggestion: '生产环境模板不应包含 console.log'
        })
      }
      return issues
    }
  })
}

// ============================================
// 5. 性能监控示例
// ============================================

async function performanceMonitoringExamples() {
  // 手动监控
  performanceMonitor.start('generate-component')
  // ... 执行生成操作 ...
  const duration = performanceMonitor.end('generate-component')
  console.log(`操作耗时: ${duration}ms`)

  // 使用 measure 方法
  await performanceMonitor.measure('batch-generation', async () => {
    // 执行批量生成
  })

  // 获取统计信息
  const stats = performanceMonitor.getStats()
  console.log(`总操作: ${stats.totalOperations}`)
  console.log(`平均耗时: ${stats.averageDuration}ms`)
  console.log(`最慢操作: ${stats.maxDuration}ms`)

  // 生成性能报告
  const report = performanceMonitor.generateReport({
    format: 'text',
    showMemory: true,
    sortBy: 'duration'
  })
  console.log(report)

  // 分析性能瓶颈
  const analysis = performanceMonitor.analyzeBottlenecks(500) // 超过500ms的操作
  console.log(`慢操作: ${analysis.slowOperations.length}`)
  console.log('优化建议:')
  analysis.recommendations.forEach(r => console.log(`  - ${r}`))

  // 实时监控（每5秒刷新）
  const timer = performanceMonitor.displayRealTime(5000)
  // 稍后停止
  // clearInterval(timer)

  // 导出性能数据
  performanceMonitor.export('./performance-report.json')

  // 内存监控
  const memoryInfo = performanceMonitor.monitorMemory()
  console.log(`内存使用: ${memoryInfo.used} bytes (${memoryInfo.percentage.toFixed(2)}%)`)
  console.log(`建议: ${memoryInfo.recommendation}`)
}

// ============================================
// 6. 完整的开发工作流示例
// ============================================

async function completeWorkflowExample() {
  const {
    PreviewGenerator,
    validate,
    performanceMonitor,
    historyManager,
    rollbackManager
  } = await import('@ldesign/generator')

  // 1. 验证模板
  const fs = await import('fs-extra')
  const templateContent = await fs.readFile('./templates/vue/component.ejs', 'utf-8')
  const validationResult = validate(templateContent)

  if (!validationResult.valid) {
    console.error('❌ 模板验证失败')
    return
  }

  // 2. 预览代码（交互式确认）
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

  // 5. 如果需要，可以回滚
  // await rollbackManager.rollbackLast()

  // 6. 导出历史用于分析
  await historyManager.export('./history.json')
}

// ============================================
// 7. CLI 命令使用示例（在终端运行）
// ============================================

/*
# 批量生成
lgen batch --config batch.json --parallel --max-concurrency 10
lgen batch --csv components.csv --template vue/component.ejs
lgen batch --config batch.json --dry-run

# 回滚操作
lgen rollback --last
lgen rollback --id <history-id>
lgen rollback --last --dry-run
lgen rollback --last --force

# 查看历史
lgen history --limit 20
lgen history --operation generate
lgen history --export ./history.json

# 验证模板
lgen validate --template vue/component.ejs
lgen validate --all

# Angular 组件生成（如果添加到CLI）
lgen c -t angular -n MyButton
lgen c -t angular -n MyButton --standalone --with-service

# 现有命令
lgen c -t vue -n MyButton
lgen p -t react -n UserList --crud list --with-api
lgen h -t vue -n useFetch --async
lgen s -t pinia -n user
lgen a -n user --restful --with-mock
lgen init
*/

// ============================================
// 运行所有示例
// ============================================

async function runAllExamples() {
  console.log('🚀 开始演示新增功能...\n')

  try {
    console.log('1️⃣  Angular 组件生成示例')
    await generateAngularExamples()

    console.log('\n2️⃣  批量生成示例')
    await batchGenerationExamples()

    console.log('\n3️⃣  历史管理和回滚示例')
    await historyAndRollbackExamples()

    console.log('\n4️⃣  模板验证示例')
    await templateValidationExamples()

    console.log('\n5️⃣  性能监控示例')
    await performanceMonitoringExamples()

    console.log('\n6️⃣  完整工作流示例')
    await completeWorkflowExample()

    console.log('\n✅ 所有示例演示完成!')
  } catch (error) {
    console.error('❌ 示例运行失败:', error)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples()
}

export {
  generateAngularExamples,
  batchGenerationExamples,
  historyAndRollbackExamples,
  templateValidationExamples,
  performanceMonitoringExamples,
  completeWorkflowExample
}
