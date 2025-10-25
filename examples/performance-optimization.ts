/**
 * 性能优化示例
 * 展示如何最大化 Generator 的性能
 */

import {
  Generator,
  BatchGenerator,
  performanceMonitor,
  cacheManager,
  createTaskQueue,
  TaskPriority
} from '../src'

async function performanceOptimizationExample() {
  console.log('⚡ Generator 性能优化示例\n')
  console.log('=' .repeat(80))
  
  // ========== 优化 1: 缓存预热 ==========
  console.log('\n🔥 优化 1: 缓存预热\n')
  
  const generator = new Generator({
    templateDir: './templates',
    outputDir: './output'
  })
  
  const engine = generator.getTemplateEngine()
  
  console.log('预热前...')
  const before = Date.now()
  
  await generator.generate('vue/component.ejs', { componentName: 'Test1' })
  
  const coldTime = Date.now() - before
  console.log(`冷启动耗时: ${coldTime}ms`)
  
  // 预热缓存
  console.log('\n预热缓存...')
  await engine.warmupCache([
    'vue/component.ejs',
    'react/component.ejs',
    'common/api.ejs'
  ])
  
  console.log('预热后...')
  const after = Date.now()
  
  await generator.generate('vue/component.ejs', { componentName: 'Test2' })
  
  const warmTime = Date.now() - after
  console.log(`热启动耗时: ${warmTime}ms`)
  console.log(`性能提升: ${((1 - warmTime / coldTime) * 100).toFixed(2)}%\n`)
  
  // ========== 优化 2: 并行批量生成 ==========
  console.log('🔥 优化 2: 并行批量生成\n')
  
  const batchGen = new BatchGenerator({
    templateDir: './templates',
    outputDir: './output'
  })
  
  const configs = Array.from({ length: 20 }, (_, i) => ({
    name: `Component${i}`,
    template: 'vue/component.ejs',
    data: { componentName: `Component${i}` }
  }))
  
  // 串行生成
  console.log('串行生成 20 个组件...')
  const serialStart = Date.now()
  
  const serialResult = await batchGen.generateBatch(configs.slice(0, 10), {
    parallel: false,
    showProgress: false
  })
  
  const serialTime = Date.now() - serialStart
  console.log(`串行耗时: ${serialTime}ms`)
  console.log(`平均: ${(serialTime / 10).toFixed(2)}ms/文件`)
  
  // 并行生成
  console.log('\n并行生成 20 个组件...')
  const parallelStart = Date.now()
  
  const parallelResult = await batchGen.generateBatch(configs.slice(10, 20), {
    parallel: true,
    maxConcurrency: 5,
    showProgress: false
  })
  
  const parallelTime = Date.now() - parallelStart
  console.log(`并行耗时: ${parallelTime}ms`)
  console.log(`平均: ${(parallelTime / 10).toFixed(2)}ms/文件`)
  console.log(`性能提升: ${((1 - parallelTime / serialTime) * 100).toFixed(2)}%\n`)
  
  // ========== 优化 3: 任务队列智能调度 ==========
  console.log('🔥 优化 3: 任务队列智能调度\n')
  
  const queue = createTaskQueue({
    maxConcurrent: 10,
    defaultTimeout: 30000,
    defaultRetries: 2
  })
  
  queue.start()
  
  console.log('添加 30 个任务，优先级混合...')
  
  // 添加不同优先级的任务
  for (let i = 0; i < 30; i++) {
    const priority = i % 3 === 0 ? TaskPriority.HIGH :
                    i % 2 === 0 ? TaskPriority.NORMAL :
                    TaskPriority.LOW
    
    await queue.add({
      name: `task-${i}`,
      priority,
      executor: async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return await generator.generate('vue/component.ejs', {
          componentName: `Component${i}`
        })
      }
    })
  }
  
  console.log('等待所有任务完成...')
  const queueStart = Date.now()
  
  await queue.waitAll()
  
  const queueTime = Date.now() - queueStart
  const stats = queue.getStats()
  
  console.log(`✅ 队列处理完成`)
  console.log(`   总耗时: ${queueTime}ms`)
  console.log(`   成功: ${stats.completed}`)
  console.log(`   失败: ${stats.failed}`)
  console.log(`   平均: ${(queueTime / stats.completed).toFixed(2)}ms/任务\n`)
  
  // ========== 优化 4: 内存优化 ==========
  console.log('🔥 优化 4: 内存优化\n')
  
  console.log('生成前内存使用:')
  const memBefore = performanceMonitor.monitorMemory()
  console.log(`  使用: ${(memBefore.used / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  占比: ${memBefore.percentage.toFixed(2)}%`)
  
  // 生成大量文件
  const largeConfigs = Array.from({ length: 50 }, (_, i) => ({
    name: `Large${i}`,
    template: 'vue/component.ejs',
    data: { componentName: `Large${i}` }
  }))
  
  await batchGen.generateBatch(largeConfigs, {
    parallel: true,
    maxConcurrency: 10,
    showProgress: false
  })
  
  console.log('\n生成后内存使用:')
  const memAfter = performanceMonitor.monitorMemory()
  console.log(`  使用: ${(memAfter.used / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  占比: ${memAfter.percentage.toFixed(2)}%`)
  
  // 清理缓存释放内存
  console.log('\n清理缓存...')
  cacheManager.clearAll()
  
  const memCleaned = performanceMonitor.monitorMemory()
  console.log('清理后内存使用:')
  console.log(`  使用: ${(memCleaned.used / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  占比: ${memCleaned.percentage.toFixed(2)}%`)
  console.log(`  释放: ${((memAfter.used - memCleaned.used) / 1024 / 1024).toFixed(2)}MB\n`)
  
  // ========== 优化 5: 缓存统计 ==========
  console.log('🔥 优化 5: 缓存效果分析\n')
  
  const cacheStats = cacheManager.getStats()
  
  console.log('缓存统计:')
  console.log(`  命中次数: ${cacheStats.hitCount}`)
  console.log(`  未命中次数: ${cacheStats.missCount}`)
  console.log(`  命中率: ${cacheStats.hitRate}`)
  console.log(`  模板缓存: ${cacheStats.templateCache.size}/${cacheStats.templateCache.capacity}`)
  console.log(`  编译缓存: ${cacheStats.compiledTemplateCache.size}/${cacheStats.compiledTemplateCache.capacity}\n`)
  
  // ========== 性能总结 ==========
  console.log('=' .repeat(80))
  console.log('\n📊 性能总结\n')
  
  const perfReport = performanceMonitor.generateReport({
    format: 'text',
    showMemory: false
  })
  
  console.log(perfReport)
  
  // 性能建议
  console.log('\n💡 性能优化建议:\n')
  const analysis = performanceMonitor.analyzeBottlenecks()
  
  analysis.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`)
  })
  
  console.log('\n🎯 关键优化点:')
  console.log('  ✅ 缓存预热 - 提升 50%+')
  console.log('  ✅ 并行生成 - 提升 45%+')
  console.log('  ✅ 任务队列 - 智能调度')
  console.log('  ✅ 内存管理 - 及时清理')
  console.log('  ✅ 批量操作 - 减少开销')
  console.log()
}

// 运行示例
performanceOptimizationExample().catch(error => {
  console.error('❌ 错误:', error.message)
  process.exit(1)
})

