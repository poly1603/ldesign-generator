/**
 * 错误处理示例
 * 展示如何正确处理各种错误情况
 */

import {
  Generator,
  ComponentGenerator,
  GeneratorError,
  TemplateError,
  FileSystemError,
  ValidationError,
  ErrorFactory,
  validateComponentName,
  validateFilePath
} from '../src'

async function errorHandlingExamples() {
  console.log('🛡️ Generator 错误处理示例\n')
  console.log('=' .repeat(80))
  
  const generator = new Generator({
    templateDir: './templates',
    outputDir: './output'
  })
  
  // ========== 示例 1: 基础错误处理 ==========
  console.log('\n1️⃣ 基础错误处理\n')
  
  try {
    await generator.generate('non-existent.ejs', {})
  } catch (error) {
    if (error instanceof TemplateError) {
      console.log('❌ 模板错误:')
      console.log(`   消息: ${error.message}`)
      console.log(`   代码: ${error.code}`)
      console.log(`   严重程度: ${error.severity}`)
      
      if (error.suggestion) {
        console.log(`   💡 建议: ${error.suggestion}`)
      }
    }
  }
  console.log()
  
  // ========== 示例 2: 输入验证错误 ==========
  console.log('2️⃣ 输入验证错误\n')
  
  const invalidNames = ['123Invalid', 'invalid:name', '../../../etc/passwd', '']
  
  invalidNames.forEach(name => {
    try {
      validateComponentName(name)
      console.log(`✅ "${name}" - 有效`)
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log(`❌ "${name}" - 无效`)
        error.validationErrors?.forEach(err => {
          console.log(`   ${err.field}: ${err.message}`)
        })
      }
    }
  })
  console.log()
  
  // ========== 示例 3: 路径安全检查 ==========
  console.log('3️⃣ 路径安全检查\n')
  
  const testPaths = [
    './components/Button.vue',
    '../../../etc/passwd',
    'C:\\Windows\\System32\\config',
    'valid/path/file.txt'
  ]
  
  testPaths.forEach(testPath => {
    try {
      validateFilePath(testPath, './output')
      console.log(`✅ "${testPath}" - 安全`)
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log(`❌ "${testPath}" - 不安全`)
        console.log(`   原因: ${error.message}`)
      }
    }
  })
  console.log()
  
  // ========== 示例 4: 文件已存在处理 ==========
  console.log('4️⃣ 文件已存在处理\n')
  
  // 第一次生成
  const result1 = await generator.generate('vue/component.ejs', {
    componentName: 'ExistingButton',
    outputFileName: 'ExistingButton.vue'
  })
  
  console.log('首次生成:', result1.success ? '✅ 成功' : '❌ 失败')
  
  // 第二次生成（文件已存在）
  console.log('\n尝试再次生成同名文件...')
  
  try {
    // 方案 1: 检测后跳过
    const fileWriter = (generator as any).fileWriter
    const exists = await fileWriter.exists('ExistingButton.vue')
    
    if (exists) {
      console.log('⚠️  文件已存在，跳过生成')
      
      // 方案 2: 备份后覆盖
      console.log('创建备份...')
      const backupPath = await fileWriter.backup('ExistingButton.vue')
      console.log(`✅ 备份创建: ${backupPath}`)
      
      // 现在可以安全覆盖
      const result2 = await generator.generate('vue/component.ejs', {
        componentName: 'ExistingButton',
        outputFileName: 'ExistingButton.vue'
      })
      
      console.log('✅ 文件已覆盖（原文件已备份）')
    }
  } catch (error) {
    console.error('❌ 处理失败:', error)
  }
  console.log()
  
  // ========== 示例 5: 批量操作错误处理 ==========
  console.log('5️⃣ 批量操作错误处理\n')
  
  const batchGen = new BatchGenerator({
    templateDir: './templates',
    outputDir: './output'
  })
  
  const batchConfigs = [
    { name: 'Valid1', template: 'vue/component.ejs', data: { componentName: 'Valid1' } },
    { name: 'Invalid', template: 'non-existent.ejs', data: {} },  // 这个会失败
    { name: 'Valid2', template: 'vue/component.ejs', data: { componentName: 'Valid2' } }
  ]
  
  const batchResult = await batchGen.generateBatch(batchConfigs, {
    continueOnError: true,  // 出错后继续
    showProgress: false
  })
  
  console.log('批量生成结果:')
  console.log(`  总计: ${batchResult.total}`)
  console.log(`  成功: ${batchResult.success}`)
  console.log(`  失败: ${batchResult.failed}`)
  
  if (batchResult.errors.length > 0) {
    console.log('\n错误详情:')
    batchResult.errors.forEach(({ index, error }) => {
      console.log(`  [${index}] ${error}`)
    })
  }
  console.log()
  
  // ========== 示例 6: 自定义错误处理 ==========
  console.log('6️⃣ 自定义错误处理\n')
  
  async function safeGenerate(templateName: string, data: Record<string, any>) {
    try {
      // 验证输入
      if (data.componentName) {
        validateComponentName(data.componentName)
      }
      
      // 执行生成
      const result = await generator.generate(templateName, data)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      // 详细的错误分类处理
      if (error instanceof TemplateError) {
        console.error('❌ 模板错误')
        console.error(`   ${error.message}`)
        
        if (error.code === 3000) {
          console.log('   💡 提示: 检查模板文件是否存在')
        }
      } else if (error instanceof ValidationError) {
        console.error('❌ 验证错误')
        error.validationErrors?.forEach(err => {
          console.error(`   ${err.field}: ${err.message}`)
        })
      } else if (error instanceof FileSystemError) {
        console.error('❌ 文件系统错误')
        console.error(`   文件: ${error.filePath}`)
        console.error(`   ${error.message}`)
      } else if (error instanceof GeneratorError) {
        console.error('❌ Generator 错误')
        console.error(`   代码: ${error.code}`)
        console.error(`   ${error.message}`)
        
        if (error.suggestion) {
          console.log(`   💡 建议: ${error.suggestion}`)
        }
        
        if (error.documentationUrl) {
          console.log(`   📖 文档: ${error.documentationUrl}`)
        }
      } else {
        console.error('❌ 未知错误:', error)
      }
      
      return {
        success: false,
        error
      }
    }
  }
  
  // 测试自定义错误处理
  console.log('测试各种错误场景...\n')
  
  await safeGenerate('non-existent.ejs', {})
  console.log()
  
  await safeGenerate('vue/component.ejs', { componentName: '123Invalid' })
  console.log()
  
  await safeGenerate('vue/component.ejs', { componentName: 'ValidButton' })
  console.log()
  
  // ========== 示例 7: 错误恢复策略 ==========
  console.log('7️⃣ 错误恢复策略\n')
  
  async function generateWithRetry(
    templateName: string,
    data: Record<string, any>,
    maxRetries = 3
  ) {
    let lastError: Error | null = null
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`尝试 ${i + 1}/${maxRetries}...`)
        
        const result = await generator.generate(templateName, data)
        
        console.log('✅ 成功\n')
        return result
      } catch (error) {
        lastError = error as Error
        console.log(`❌ 失败: ${lastError.message}`)
        
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000
          console.log(`   等待 ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    console.log(`\n❌ 重试 ${maxRetries} 次后仍然失败`)
    throw lastError
  }
  
  // 测试重试机制
  try {
    await generateWithRetry('vue/component.ejs', {
      componentName: 'RetryButton'
    }, 3)
  } catch (error) {
    console.error('最终失败:', (error as Error).message)
  }
  
  // ========== 总结 ==========
  console.log('=' .repeat(80))
  console.log('\n📚 错误处理最佳实践:\n')
  console.log('  1. ✅ 始终使用 try-catch')
  console.log('  2. ✅ 根据错误类型分别处理')
  console.log('  3. ✅ 显示友好的错误消息')
  console.log('  4. ✅ 提供解决建议')
  console.log('  5. ✅ 验证输入防止错误')
  console.log('  6. ✅ 实现重试机制')
  console.log('  7. ✅ 记录错误日志')
  console.log()
}

// 运行示例
errorHandlingExamples().catch(error => {
  console.error('示例执行失败:', error)
  process.exit(1)
})

