import { Generator } from './generator'
import type { GeneratorOptions, GenerateResult } from '../types'
import { logger } from './logger'
import { performanceMonitor } from './performance-monitor'
import chalk from 'chalk'
import ora, { Ora } from 'ora'

/**
 * 批量生成配置
 */
export interface BatchConfig {
  name: string
  template: string
  data: Record<string, any>
}

/**
 * 批量生成选项
 */
export interface BatchGenerateOptions {
  parallel?: boolean
  maxConcurrency?: number
  continueOnError?: boolean
  showProgress?: boolean
}

/**
 * 批量生成结果
 */
export interface BatchGenerateResult {
  total: number
  success: number
  failed: number
  results: GenerateResult[]
  duration: number
  errors: Array<{ index: number; error: string }>
}

/**
 * 批量生成器 - 支持并行批量生成
 */
export class BatchGenerator {
  private generator: Generator
  private spinner: Ora | null = null

  constructor(options: GeneratorOptions) {
    this.generator = new Generator(options)
  }

  /**
   * 批量生成
   */
  async generateBatch(
    configs: BatchConfig[],
    options?: BatchGenerateOptions
  ): Promise<BatchGenerateResult> {
    const startTime = Date.now()
    const parallel = options?.parallel ?? false
    const maxConcurrency = options?.maxConcurrency ?? 5
    const continueOnError = options?.continueOnError ?? true
    const showProgress = options?.showProgress ?? true

    logger.info(`开始批量生成 ${configs.length} 个文件`, { parallel, maxConcurrency })

    if (showProgress) {
      this.spinner = ora({
        text: chalk.cyan('准备批量生成...'),
        color: 'cyan'
      }).start()
    }

    const results: GenerateResult[] = []
    const errors: Array<{ index: number; error: string }> = []

    try {
      if (parallel) {
        // 并行生成
        const chunks = this.chunkArray(configs, maxConcurrency)

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
          const chunk = chunks[chunkIndex]

          if (this.spinner) {
            this.spinner.text = chalk.cyan(
              `批量生成中... (${chunkIndex * maxConcurrency + 1}-${Math.min((chunkIndex + 1) * maxConcurrency, configs.length)}/${configs.length})`
            )
          }

          const chunkResults = await Promise.allSettled(
            chunk.map((config, localIndex) =>
              this.generateSingle(config, chunkIndex * maxConcurrency + localIndex, continueOnError)
            )
          )

          chunkResults.forEach((result, localIndex) => {
            const globalIndex = chunkIndex * maxConcurrency + localIndex

            if (result.status === 'fulfilled') {
              results.push(result.value)
            } else {
              const errorResult: GenerateResult = {
                success: false,
                error: result.reason?.message || '未知错误',
                message: '生成失败'
              }
              results.push(errorResult)
              errors.push({
                index: globalIndex,
                error: result.reason?.message || '未知错误'
              })
            }
          })
        }
      } else {
        // 串行生成
        for (let i = 0; i < configs.length; i++) {
          if (this.spinner) {
            this.spinner.text = chalk.cyan(`批量生成中... (${i + 1}/${configs.length})`)
          }

          try {
            const result = await this.generateSingle(configs[i], i, continueOnError)
            results.push(result)
          } catch (error) {
            const errorResult: GenerateResult = {
              success: false,
              error: (error as Error).message,
              message: '生成失败'
            }
            results.push(errorResult)
            errors.push({
              index: i,
              error: (error as Error).message
            })

            if (!continueOnError) {
              break
            }
          }
        }
      }

      const duration = Date.now() - startTime
      const successCount = results.filter(r => r.success).length
      const failedCount = results.length - successCount

      const batchResult: BatchGenerateResult = {
        total: configs.length,
        success: successCount,
        failed: failedCount,
        results,
        duration,
        errors
      }

      // 显示结果
      if (this.spinner) {
        if (failedCount === 0) {
          this.spinner.succeed(
            chalk.green(`✓ 批量生成完成！成功 ${successCount}/${configs.length} (${formatDuration(duration)})`)
          )
        } else {
          this.spinner.warn(
            chalk.yellow(`⚠ 批量生成完成，成功 ${successCount}/${configs.length}，失败 ${failedCount} (${formatDuration(duration)})`)
          )
        }
      }

      logger.info('批量生成完成', {
        total: batchResult.total,
        success: batchResult.success,
        failed: batchResult.failed,
        duration: batchResult.duration
      })

      return batchResult
    } catch (error) {
      if (this.spinner) {
        this.spinner.fail(chalk.red('✗ 批量生成失败'))
      }

      logger.error('批量生成失败', error as Error)
      throw error
    }
  }

  /**
   * 生成单个文件
   */
  private async generateSingle(
    config: BatchConfig,
    index: number,
    continueOnError: boolean
  ): Promise<GenerateResult> {
    const operationName = `batch-generate:${index}:${config.name}`

    return await performanceMonitor.measure(operationName, async () => {
      try {
        const result = await this.generator.generate(config.template, config.data)

        if (!result.success && !continueOnError) {
          throw new Error(result.error || '生成失败')
        }

        return result
      } catch (error) {
        logger.debug(`文件 ${config.name} 生成失败`, { error: (error as Error).message })
        throw error
      }
    })
  }

  /**
   * 从 JSON 文件加载批量配置
   */
  async loadConfigFromFile(filePath: string): Promise<BatchConfig[]> {
    logger.info(`从文件加载批量配置: ${filePath}`)

    const fs = await import('fs-extra')
    const content = await fs.readFile(filePath, 'utf-8')

    try {
      const configs = JSON.parse(content)

      if (!Array.isArray(configs)) {
        throw new Error('配置文件必须是数组格式')
      }

      // 验证配置
      configs.forEach((config, index) => {
        if (!config.name || !config.template || !config.data) {
          throw new Error(`配置项 ${index} 缺少必需字段 (name, template, data)`)
        }
      })

      logger.info(`✓ 成功加载 ${configs.length} 个配置项`)

      return configs
    } catch (error) {
      logger.error('配置文件解析失败', error as Error)
      throw error
    }
  }

  /**
   * 从 CSV 加载批量配置
   */
  async loadConfigFromCSV(filePath: string, templateName: string): Promise<BatchConfig[]> {
    logger.info(`从 CSV 加载批量配置: ${filePath}`)

    const fs = await import('fs-extra')
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      throw new Error('CSV 文件至少需要包含标题行和一行数据')
    }

    // 解析标题行
    const headers = lines[0].split(',').map(h => h.trim())

    // 解析数据行
    const configs: BatchConfig[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const data: Record<string, any> = {}

      headers.forEach((header, index) => {
        data[header] = values[index] || ''
      })

      configs.push({
        name: data.name || `item-${i}`,
        template: templateName,
        data: {
          ...data,
          outputFileName: data.name ? `${data.name}.${templateName.split('.')[1]}` : undefined
        }
      })
    }

    logger.info(`✓ 从 CSV 加载了 ${configs.length} 个配置项`)

    return configs
  }

  /**
   * 显示批量生成结果
   */
  static displayResult(result: BatchGenerateResult): void {
    console.log('\n' + chalk.bold.cyan('📊 批量生成结果:'))
    console.log(chalk.gray('═'.repeat(80)))

    // 统计信息
    console.log(chalk.bold('\n统计:'))
    console.log(`  总文件数: ${chalk.cyan(result.total)}`)
    console.log(`  成功: ${chalk.green(result.success)}`)
    console.log(`  失败: ${chalk.red(result.failed)}`)
    console.log(`  耗时: ${chalk.cyan(formatDuration(result.duration))}`)
    console.log(`  平均: ${chalk.cyan(formatDuration(result.duration / result.total))}/文件`)

    // 成功率
    const successRate = (result.success / result.total * 100).toFixed(2)
    const progressBar = createProgressBar(result.success, result.total, 40)
    console.log(`\n  成功率: ${progressBar} ${chalk.cyan(successRate + '%')}`)

    // 错误列表
    if (result.errors.length > 0) {
      console.log(chalk.bold.red('\n❌ 错误列表:'))
      result.errors.forEach(({ index, error }, i) => {
        console.log(`  ${i + 1}. [${index}] ${error}`)
      })
    }

    // 成功的文件
    const successFiles = result.results
      .map((r, i) => ({ result: r, index: i }))
      .filter(({ result }) => result.success)

    if (successFiles.length > 0 && successFiles.length <= 10) {
      console.log(chalk.bold.green('\n✓ 成功生成的文件:'))
      successFiles.forEach(({ result, index }) => {
        console.log(`  ${index + 1}. ${result.outputPath}`)
      })
    } else if (successFiles.length > 10) {
      console.log(chalk.bold.green(`\n✓ 成功生成 ${successFiles.length} 个文件`))
      console.log(chalk.gray('  (列表过长，仅显示统计信息)'))
    }

    console.log(chalk.gray('\n' + '═'.repeat(80) + '\n'))
  }

  /**
   * 将数组分块
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }

    return chunks
  }
}

/**
 * 创建进度条
 */
function createProgressBar(value: number, max: number, width: number = 40): string {
  const percentage = max > 0 ? value / max : 0
  const filled = Math.round(percentage * width)
  const empty = width - filled

  const bar = '█'.repeat(filled) + '░'.repeat(empty)

  if (percentage >= 1) {
    return chalk.green(bar)
  } else if (percentage >= 0.8) {
    return chalk.cyan(bar)
  } else if (percentage >= 0.5) {
    return chalk.yellow(bar)
  } else {
    return chalk.red(bar)
  }
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  } else {
    return `${(ms / 60000).toFixed(2)}min`
  }
}

/**
 * 创建批量生成器
 */
export function createBatchGenerator(options: GeneratorOptions): BatchGenerator {
  return new BatchGenerator(options)
}

export default BatchGenerator


