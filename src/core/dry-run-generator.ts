import chalk from 'chalk'
import { Generator } from './generator'
import type { GenerateResult, GeneratorOptions } from '../types'
import { logger } from './logger'

/**
 * 干运行结果
 */
export interface DryRunResult {
  files: DryRunFile[]
  totalFiles: number
  estimatedSize: number
  warnings: string[]
}

/**
 * 干运行文件信息
 */
export interface DryRunFile {
  path: string
  content: string
  size: number
  action: 'create' | 'overwrite'
  exists: boolean
}

/**
 * 干运行生成器 - 模拟生成但不实际写入文件
 */
export class DryRunGenerator extends Generator {
  private dryRunFiles: DryRunFile[] = []
  private warnings: string[] = []

  constructor(options: GeneratorOptions) {
    super(options)
  }

  /**
   * 干运行生成
   */
  async dryRunGenerate(templateName: string, data: Record<string, any>): Promise<DryRunResult> {
    logger.info('🔍 开始干运行模式...')

    this.dryRunFiles = []
    this.warnings = []

    try {
      // 使用父类的生成方法，但拦截写入操作
      await this.simulateGenerate(templateName, data)

      const result: DryRunResult = {
        files: this.dryRunFiles,
        totalFiles: this.dryRunFiles.length,
        estimatedSize: this.dryRunFiles.reduce((sum, f) => sum + f.size, 0),
        warnings: this.warnings
      }

      logger.info(`✓ 干运行完成，将创建 ${result.totalFiles} 个文件`)

      return result
    } catch (error) {
      logger.error('干运行失败', error as Error)
      throw error
    }
  }

  /**
   * 模拟生成
   */
  private async simulateGenerate(templateName: string, data: Record<string, any>): Promise<void> {
    const fs = await import('fs-extra')
    const path = await import('path')

    // 渲染模板
    const templateEngine = this.getTemplateEngine()
    const content = await templateEngine.render(templateName, data)

    // 确定输出路径
    const fileName = data.outputFileName || templateName.replace('.ejs', '').replace('.hbs', '')
    const outputPath = path.join(
      (this as any).options.outputDir,
      fileName
    )

    // 检查文件是否已存在
    const exists = await fs.pathExists(outputPath)

    if (exists) {
      this.warnings.push(`文件已存在，将被覆盖: ${outputPath}`)
    }

    // 记录文件信息
    this.dryRunFiles.push({
      path: outputPath,
      content,
      size: Buffer.byteLength(content, 'utf-8'),
      action: exists ? 'overwrite' : 'create',
      exists
    })
  }

  /**
   * 批量干运行
   */
  async dryRunBatch(items: Array<{ template: string; data: Record<string, any> }>): Promise<DryRunResult> {
    logger.info(`🔍 开始批量干运行模式 (${items.length} 项)...`)

    this.dryRunFiles = []
    this.warnings = []

    for (const item of items) {
      try {
        await this.simulateGenerate(item.template, item.data)
      } catch (error) {
        this.warnings.push(`模板 ${item.template} 生成失败: ${(error as Error).message}`)
      }
    }

    const result: DryRunResult = {
      files: this.dryRunFiles,
      totalFiles: this.dryRunFiles.length,
      estimatedSize: this.dryRunFiles.reduce((sum, f) => sum + f.size, 0),
      warnings: this.warnings
    }

    logger.info(`✓ 批量干运行完成，将创建 ${result.totalFiles} 个文件`)

    return result
  }

  /**
   * 显示干运行结果
   */
  static displayResult(result: DryRunResult, options?: {
    showContent?: boolean
    maxContentLength?: number
  }): void {
    const showContent = options?.showContent ?? false
    const maxContentLength = options?.maxContentLength ?? 500

    console.log('\n' + chalk.bold.cyan('📋 干运行结果:'))
    console.log(chalk.gray('─'.repeat(80)))

    // 文件列表
    console.log(chalk.bold('\n📁 将要创建的文件:'))
    result.files.forEach((file, index) => {
      const icon = file.action === 'create' ? '🆕' : '♻️'
      const action = file.action === 'create' ? chalk.green('CREATE') : chalk.yellow('OVERWRITE')
      const size = formatSize(file.size)

      console.log(`${index + 1}. ${icon} [${action}] ${file.path} ${chalk.gray(`(${size})`)}`)

      if (showContent) {
        const preview = file.content.length > maxContentLength
          ? file.content.slice(0, maxContentLength) + '\n...(truncated)'
          : file.content

        console.log(chalk.gray('   内容预览:'))
        console.log(chalk.gray('   ' + '┌' + '─'.repeat(76)))
        preview.split('\n').forEach(line => {
          console.log(chalk.gray('   │ ') + line.slice(0, 74))
        })
        console.log(chalk.gray('   └' + '─'.repeat(76)))
        console.log()
      }
    })

    // 统计信息
    console.log(chalk.bold('\n📊 统计信息:'))
    console.log(`   总文件数: ${chalk.cyan(result.totalFiles)}`)
    console.log(`   预计大小: ${chalk.cyan(formatSize(result.estimatedSize))}`)

    const createCount = result.files.filter(f => f.action === 'create').length
    const overwriteCount = result.files.filter(f => f.action === 'overwrite').length

    console.log(`   新建文件: ${chalk.green(createCount)}`)
    console.log(`   覆盖文件: ${chalk.yellow(overwriteCount)}`)

    // 警告信息
    if (result.warnings.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️  警告:'))
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    }

    console.log(chalk.gray('\n' + '─'.repeat(80)))
    console.log(chalk.dim('💡 这是干运行模式，未实际创建文件。'))
    console.log(chalk.dim('   移除 --dry-run 标志以实际生成文件。'))
    console.log()
  }

  /**
   * 比较干运行和实际结果
   */
  static async compare(dryRunResult: DryRunResult, actualResults: GenerateResult[]): Promise<void> {
    console.log(chalk.bold.cyan('\n📊 干运行 vs 实际结果对比:'))
    console.log(chalk.gray('─'.repeat(80)))

    const dryRunPaths = new Set(dryRunResult.files.map(f => f.path))
    const actualPaths = new Set(actualResults.filter(r => r.success).map(r => r.outputPath!))

    // 检查一致性
    const consistent = dryRunPaths.size === actualPaths.size &&
      Array.from(dryRunPaths).every(p => actualPaths.has(p))

    if (consistent) {
      console.log(chalk.green('✓ 结果一致，干运行准确预测了实际生成结果'))
    } else {
      console.log(chalk.yellow('⚠ 结果不一致'))

      // 显示差异
      dryRunPaths.forEach(path => {
        if (!actualPaths.has(path)) {
          console.log(chalk.red(`  - 预期但未生成: ${path}`))
        }
      })

      actualPaths.forEach(path => {
        if (!dryRunPaths.has(path)) {
          console.log(chalk.yellow(`  + 未预期但生成: ${path}`))
        }
      })
    }

    console.log(chalk.gray('─'.repeat(80) + '\n'))
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}

/**
 * 创建干运行生成器
 */
export function createDryRunGenerator(options: GeneratorOptions): DryRunGenerator {
  return new DryRunGenerator(options)
}

export default DryRunGenerator


