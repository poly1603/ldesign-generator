/**
 * 批量操作示例
 */

import {
  BatchGenerator,
  historyManager,
  rollbackManager,
  performanceMonitor,
  type BatchConfig
} from '../src'
import fs from 'fs-extra'

async function main() {
  console.log('📦 批量操作示例\n')

  // ===== 1. 从 JSON 配置批量生成 =====
  console.log('1️⃣  从 JSON 配置批量生成...')

  // 创建配置文件
  const configs: BatchConfig[] = [
    {
      name: 'HomePage',
      template: 'vue/page.ejs',
      data: {
        pageName: 'HomePage',
        crudType: 'none',
        outputFileName: 'HomePage.vue'
      }
    },
    {
      name: 'AboutPage',
      template: 'vue/page.ejs',
      data: {
        pageName: 'AboutPage',
        crudType: 'none',
        outputFileName: 'AboutPage.vue'
      }
    },
    {
      name: 'ContactPage',
      template: 'vue/page.ejs',
      data: {
        pageName: 'ContactPage',
        crudType: 'none',
        outputFileName: 'ContactPage.vue'
      }
    }
  ]

  await fs.writeFile(
    './batch-config.json',
    JSON.stringify(configs, null, 2)
  )

  const batchGen = new BatchGenerator({
    templateDir: './templates',
    outputDir: './output/batch'
  })

  // 从文件加载并生成
  const loadedConfigs = await batchGen.loadConfigFromFile('./batch-config.json')

  const result = await batchGen.generateBatch(loadedConfigs, {
    parallel: true,
    maxConcurrency: 5,
    continueOnError: true,
    showProgress: true
  })

  BatchGenerator.displayResult(result)

  // ===== 2. 从 CSV 批量生成 =====
  console.log('\n2️⃣  从 CSV 批量生成...')

  // 创建 CSV 文件
  const csvContent = `name,description,type
UserButton,用户操作按钮,primary
DeleteButton,删除按钮,danger
SubmitButton,提交按钮,success
CancelButton,取消按钮,default`

  await fs.writeFile('./components.csv', csvContent)

  const csvConfigs = await batchGen.loadConfigFromCSV(
    './components.csv',
    'react/component.ejs'
  )

  console.log(`从 CSV 加载了 ${csvConfigs.length} 个配置`)

  // ===== 3. 查看生成历史 =====
  console.log('\n3️⃣  查看生成历史...')

  const recentHistory = historyManager.getRecent(10)
  console.log(`最近 ${recentHistory.length} 条历史:`)

  recentHistory.forEach((entry, index) => {
    const time = entry.timestamp.toLocaleString()
    const status = entry.success ? '✓' : '✗'
    console.log(`  ${index + 1}. ${status} ${entry.operation} - ${entry.templateName} (${time})`)
  })

  // 历史统计
  const historyStats = historyManager.getStats()
  console.log(`\n历史统计:`)
  console.log(`  总操作: ${historyStats.total}`)
  console.log(`  成功: ${historyStats.successful}`)
  console.log(`  失败: ${historyStats.failed}`)
  console.log(`  成功率: ${historyStats.successRate}`)

  // ===== 4. 导出历史 =====
  console.log('\n4️⃣  导出历史记录...')
  await historyManager.export('./output/history.json', 'json')
  await historyManager.export('./output/history.csv', 'csv')
  console.log('✓ 历史记录已导出')

  // ===== 5. 回滚操作 =====
  console.log('\n5️⃣  回滚最近的操作（演示）...')

  if (recentHistory.length > 0) {
    const lastEntry = recentHistory[0]

    console.log(`将回滚: ${lastEntry.id}`)
    console.log(`  操作: ${lastEntry.operation}`)
    console.log(`  模板: ${lastEntry.templateName}`)
    console.log(`  文件: ${lastEntry.files.length} 个`)

    // 干运行模式回滚（不实际删除）
    const rollbackResult = await rollbackManager.rollback(lastEntry.id, {
      dryRun: true,
      backup: true,
      interactive: false
    })

    console.log(`\n回滚结果（干运行）:`)
    console.log(`  将删除: ${rollbackResult.filesDeleted} 个文件`)
    console.log(`  跳过: ${rollbackResult.filesSkipped} 个文件`)
  } else {
    console.log('没有可回滚的历史')
  }

  // ===== 6. 性能报告 =====
  console.log('\n6️⃣  生成性能报告...')
  const report = performanceMonitor.generateReport({
    format: 'text',
    showMemory: true
  })

  console.log(report)

  // ===== 7. 清理 =====
  console.log('\n🧹 清理测试文件...')
  await fs.remove('./batch-config.json')
  await fs.remove('./components.csv')
  console.log('✓ 清理完成')

  console.log('\n✅ 所有批量操作演示完成！')
}

main().catch(console.error)

