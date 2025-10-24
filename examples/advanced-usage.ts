/**
 * Generator 高级功能示例
 */

import {
  Generator,
  BatchGenerator,
  DryRunGenerator,
  PreviewGenerator,
  logger,
  LogLevel,
  cacheManager,
  performanceMonitor,
  historyManager,
  rollbackManager,
  validate,
  stylePlugin,
  testPlugin,
  docPlugin
} from '../src'

async function main() {
  console.log('🚀 Generator 高级功能示例\n')

  // ===== 1. 日志系统 =====
  console.log('1️⃣  配置日志系统...')
  logger.setLevel(LogLevel.DEBUG)
  logger.setFileEnabled(true)
  logger.info('日志系统已启用')
  console.log()

  // ===== 2. 使用插件 =====
  console.log('2️⃣  使用插件系统...')
  const generator = new Generator({
    templateDir: './templates',
    outputDir: './output',
    plugins: [stylePlugin, testPlugin, docPlugin],
    config: {
      defaultLang: 'ts',
      styleType: 'scss',
      testFramework: 'vitest',
      prettier: true
    }
  })

  logger.info('插件已加载', {
    plugins: ['stylePlugin', 'testPlugin', 'docPlugin']
  })
  console.log()

  // ===== 3. 模板验证 =====
  console.log('3️⃣  验证模板...')
  const templateContent = `<template>
  <div class="test">
    <%= componentName %>
  </div>
</template>`

  const validationResult = validate(templateContent, 'ejs')

  if (validationResult.valid) {
    console.log('✓ 模板验证通过')
  } else {
    console.log(`⚠ 发现 ${validationResult.errors} 个错误`)
  }
  console.log()

  // ===== 4. 干运行模式 =====
  console.log('4️⃣  干运行模式（预览）...')
  const dryRunGen = new DryRunGenerator({
    templateDir: './templates',
    outputDir: './output'
  })

  const dryRunResult = await dryRunGen.dryRunGenerate('vue/component.ejs', {
    componentName: 'TestComponent',
    outputFileName: 'TestComponent.vue'
  })

  console.log(`将创建 ${dryRunResult.totalFiles} 个文件`)
  console.log(`预计大小: ${dryRunResult.estimatedSize} bytes`)
  console.log()

  // ===== 5. 批量生成 =====
  console.log('5️⃣  批量生成...')
  const batchGen = new BatchGenerator({
    templateDir: './templates',
    outputDir: './output/batch'
  })

  const batchConfigs = [
    {
      name: 'Button',
      template: 'vue/component.ejs',
      data: { componentName: 'Button', outputFileName: 'Button.vue' }
    },
    {
      name: 'Input',
      template: 'vue/component.ejs',
      data: { componentName: 'Input', outputFileName: 'Input.vue' }
    },
    {
      name: 'Select',
      template: 'vue/component.ejs',
      data: { componentName: 'Select', outputFileName: 'Select.vue' }
    }
  ]

  const batchResult = await batchGen.generateBatch(batchConfigs, {
    parallel: true,
    maxConcurrency: 3,
    showProgress: true
  })

  console.log(`批量生成完成: ${batchResult.success}/${batchResult.total} 成功`)
  console.log()

  // ===== 6. 代码预览 =====
  console.log('6️⃣  代码预览（带 Diff）...')
  const previewGen = new PreviewGenerator({
    templateDir: './templates',
    outputDir: './output'
  })

  const previewResult = await previewGen.generatePreview(
    'react/component.ejs',
    {
      componentName: 'PreviewComponent',
      outputFileName: 'PreviewComponent.tsx'
    },
    {
      showDiff: true,
      showLineNumbers: true,
      interactive: false
    }
  )

  console.log(`预览生成完成: ${previewResult.path}`)
  console.log()

  // ===== 7. 性能监控 =====
  console.log('7️⃣  查看性能统计...')
  const perfStats = performanceMonitor.getStats()

  console.log(`总操作数: ${perfStats.totalOperations}`)
  console.log(`平均耗时: ${perfStats.averageDuration.toFixed(2)}ms`)

  // 分析瓶颈
  const bottlenecks = performanceMonitor.analyzeBottlenecks(100)
  console.log(`慢操作: ${bottlenecks.slowOperations.length}`)
  console.log(`建议: ${bottlenecks.recommendations.join(', ')}`)
  console.log()

  // ===== 8. 缓存统计 =====
  console.log('8️⃣  查看缓存统计...')
  const cacheStats = cacheManager.getStats()

  console.log(`缓存命中率: ${cacheStats.hitRate}`)
  console.log(`模板缓存: ${cacheStats.templateCache.size}/${cacheStats.templateCache.capacity}`)
  console.log()

  // ===== 9. 历史记录 =====
  console.log('9️⃣  查看历史记录...')
  const recentHistory = historyManager.getRecent(5)

  console.log(`最近 ${recentHistory.length} 条记录:`)
  recentHistory.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.operation} - ${entry.templateName} (${entry.success ? '成功' : '失败'})`)
  })
  console.log()

  // ===== 10. 导出日志和历史 =====
  console.log('🔟 导出数据...')

  // 导出性能报告
  const perfReport = performanceMonitor.export()
  console.log('性能报告已生成')

  // 导出历史
  await historyManager.export('./output/history.json', 'json')
  console.log('历史记录已导出')
  console.log()

  // ===== 完成 =====
  console.log('✅ 所有高级功能演示完成！')
  console.log('\n💡 提示: 使用 rollbackManager.rollbackLast() 可以撤销最近的操作')

  // 确保日志写入
  logger.close()
}

main().catch(console.error)

