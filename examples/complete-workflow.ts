/**
 * 完整工作流示例
 * 展示所有主要功能的集成使用
 */

import {
  Generator,
  ComponentGenerator,
  PageGenerator,
  ApiGenerator,
  BatchGenerator,
  DryRunGenerator,
  PreviewGenerator,
  stylePlugin,
  testPlugin,
  typescriptPlugin,
  logger,
  performanceMonitor,
  cacheManager,
  historyManager,
  createTaskQueue,
  TaskPriority
} from '../src'

async function completeWorkflow() {
  console.log('🚀 Generator 完整工作流示例\n')
  console.log('=' .repeat(80))
  
  // ========== 阶段 1: 初始化和配置 ==========
  console.log('\n📝 阶段 1: 初始化和配置\n')
  
  const generator = new Generator({
    templateDir: './templates',
    outputDir: './output',
    plugins: [stylePlugin, testPlugin, typescriptPlugin],
    config: {
      defaultLang: 'ts',
      styleType: 'scss',
      testFramework: 'vitest',
      prettier: true
    }
  })
  
  console.log('✅ Generator 初始化完成')
  console.log('✅ 已加载 3 个插件')
  
  // 预热缓存
  const engine = generator.getTemplateEngine()
  await engine.warmupCache([
    'vue/component.ejs',
    'react/component.ejs',
    'common/api.ejs'
  ])
  console.log('✅ 缓存预热完成\n')
  
  // ========== 阶段 2: 干运行模式 ==========
  console.log('📝 阶段 2: 干运行模式（预览将要创建的文件）\n')
  
  const dryRunGen = new DryRunGenerator({
    templateDir: './templates',
    outputDir: './output'
  })
  
  const dryRunResult = await dryRunGen.dryRunGenerate('vue/component.ejs', {
    componentName: 'TestButton',
    withStyle: true,
    withTest: true
  })
  
  console.log(`将创建 ${dryRunResult.totalFiles} 个文件`)
  console.log(`预计大小: ${dryRunResult.estimatedSize} 字节`)
  
  if (dryRunResult.warnings.length > 0) {
    console.log('⚠️  警告:', dryRunResult.warnings)
  }
  console.log()
  
  // ========== 阶段 3: 单个文件生成 ==========
  console.log('📝 阶段 3: 生成单个组件\n')
  
  const result1 = await generator.generate('vue/component.ejs', {
    componentName: 'MyButton',
    props: [
      { name: 'type', type: 'string', default: 'primary' },
      { name: 'size', type: "'small' | 'medium' | 'large'" }
    ],
    emits: ['click', 'change'],
    withStyle: true,
    withTest: true,
    withTypes: true,
    outputFileName: 'MyButton.vue'
  })
  
  console.log(result1.success ? '✅ 组件生成成功' : '❌ 生成失败')
  console.log('   文件:', result1.outputPath)
  console.log()
  
  // ========== 阶段 4: 批量生成 ==========
  console.log('📝 阶段 4: 批量生成多个组件\n')
  
  const batchGen = new BatchGenerator({
    templateDir: './templates',
    outputDir: './output/components'
  })
  
  const batchResult = await batchGen.generateBatch([
    { 
      name: 'Button',
      template: 'vue/component.ejs',
      data: { componentName: 'Button', withStyle: true }
    },
    {
      name: 'Input',
      template: 'vue/component.ejs',
      data: { componentName: 'Input', withStyle: true }
    },
    {
      name: 'Select',
      template: 'vue/component.ejs',
      data: { componentName: 'Select', withStyle: true }
    }
  ], {
    parallel: true,
    maxConcurrency: 3,
    continueOnError: true,
    showProgress: true
  })
  
  console.log(`✅ 批量生成完成: ${batchResult.success}/${batchResult.total}`)
  console.log(`   耗时: ${batchResult.duration}ms\n`)
  
  // ========== 阶段 5: 使用任务队列 ==========
  console.log('📝 阶段 5: 使用任务队列（高级并发控制）\n')
  
  const queue = createTaskQueue({
    maxConcurrent: 5,
    defaultTimeout: 30000
  })
  
  queue.start()
  
  // 添加高优先级任务
  await queue.add({
    name: 'urgent-component',
    priority: TaskPriority.URGENT,
    executor: async () => {
      return await generator.generate('vue/component.ejs', {
        componentName: 'UrgentButton'
      })
    }
  })
  
  // 添加普通任务
  await queue.add({
    name: 'normal-component',
    priority: TaskPriority.NORMAL,
    executor: async () => {
      return await generator.generate('vue/component.ejs', {
        componentName: 'NormalButton'
      })
    }
  })
  
  // 等待完成
  await queue.waitAll(10000)
  
  const queueStats = queue.getStats()
  console.log(`✅ 任务队列完成: ${queueStats.completed}/${queueStats.total}`)
  console.log()
  
  // ========== 阶段 6: 生成完整模块 ==========
  console.log('📝 阶段 6: 生成完整的 CRUD 模块\n')
  
  const pageGen = new PageGenerator('./templates', './output/pages')
  const apiGen = new ApiGenerator('./templates', './output/api')
  const compGen = new ComponentGenerator('./templates', './output/stores')
  
  // API
  console.log('  生成 API...')
  await apiGen.generateRestfulApi({
    name: 'product',
    resource: 'products',
    withMock: true
  })
  
  // Store
  console.log('  生成 Store...')
  await compGen.generateVueStore({
    name: 'product',
    type: 'pinia',
    state: [
      { name: 'products', type: 'Product[]', default: [] },
      { name: 'loading', type: 'boolean', default: false }
    ],
    actions: ['fetchProducts', 'createProduct', 'updateProduct', 'deleteProduct']
  })
  
  // CRUD 页面
  console.log('  生成 CRUD 页面...')
  const crudResults = await pageGen.generateCrudPages({
    name: 'Product',
    type: 'vue',
    withApi: true,
    withStore: true
  })
  
  console.log(`✅ 完整模块生成完成: ${crudResults.length} 个页面\n`)
  
  // ========== 阶段 7: 性能分析 ==========
  console.log('📝 阶段 7: 性能分析\n')
  
  const perfStats = performanceMonitor.getStats()
  console.log('性能统计:')
  console.log(`  总操作: ${perfStats.totalOperations}`)
  console.log(`  总耗时: ${perfStats.totalDuration.toFixed(2)}ms`)
  console.log(`  平均耗时: ${perfStats.averageDuration.toFixed(2)}ms`)
  console.log(`  最慢操作: ${perfStats.maxDuration.toFixed(2)}ms`)
  
  // 缓存统计
  const cacheStats = cacheManager.getStats()
  console.log('\n缓存统计:')
  console.log(`  命中率: ${cacheStats.hitRate}`)
  console.log(`  命中次数: ${cacheStats.hitCount}`)
  console.log(`  未命中次数: ${cacheStats.missCount}`)
  console.log()
  
  // ========== 阶段 8: 历史记录 ==========
  console.log('📝 阶段 8: 查看历史记录\n')
  
  const recentHistory = historyManager.getRecent(5)
  console.log(`最近的 ${recentHistory.length} 条记录:`)
  recentHistory.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.operation} - ${entry.templateName}`)
    console.log(`     时间: ${entry.timestamp.toLocaleString()}`)
    console.log(`     文件: ${entry.files.length} 个`)
  })
  
  const historyStats = historyManager.getStats()
  console.log(`\n历史统计: 总记录 ${historyStats.total}，成功率 ${historyStats.successRate}\n`)
  
  // ========== 总结 ==========
  console.log('=' .repeat(80))
  console.log('\n🎉 完整工作流演示完成！\n')
  console.log('✨ 展示功能:')
  console.log('  ✅ 基础生成')
  console.log('  ✅ 干运行模式')
  console.log('  ✅ 批量生成')
  console.log('  ✅ 任务队列')
  console.log('  ✅ CRUD 模块生成')
  console.log('  ✅ 性能监控')
  console.log('  ✅ 历史记录')
  console.log('\n📁 生成的文件位于: ./output/')
  console.log()
}

// 运行完整工作流
main().catch(error => {
  console.error('❌ 工作流执行失败:', error.message)
  if (error.suggestion) {
    console.log('💡 建议:', error.suggestion)
  }
  process.exit(1)
})

