import type { GeneratorOptions, GenerateResult, PluginContext } from '../types'
import { TemplateEngine } from './template-engine'
import { FileWriter } from './file-writer'
import { PluginManager } from './plugin-system'
import { logger } from './logger'
import { cacheManager } from './cache-manager'
import { performanceMonitor } from './performance-monitor'
import { historyManager } from './history-manager'

/**
 * 代码生成器主类（集成所有高级功能）
 */
export class Generator {
  private templateEngine: TemplateEngine
  private fileWriter: FileWriter
  private pluginManager: PluginManager

  constructor(private options: GeneratorOptions) {
    this.templateEngine = new TemplateEngine(options.templateDir)
    this.fileWriter = new FileWriter(options.outputDir)
    this.pluginManager = new PluginManager()

    // 注册插件
    if (options.plugins && options.plugins.length > 0) {
      this.pluginManager.registerBatch(options.plugins)
      this.pluginManager.loadAll()
    }

    logger.debug('Generator 初始化完成', {
      templateDir: options.templateDir,
      outputDir: options.outputDir,
      plugins: options.plugins?.length || 0
    })
  }

  /**
   * 获取模板引擎
   */
  getTemplateEngine(): TemplateEngine {
    return this.templateEngine
  }

  /**
   * 获取插件管理器
   */
  getPluginManager(): PluginManager {
    return this.pluginManager
  }

  /**
   * 生成代码（集成性能监控、缓存、历史记录）
   */
  async generate(templateName: string, data: Record<string, any>): Promise<GenerateResult> {
    const operationName = `generate:${templateName}`

    return await performanceMonitor.measure(operationName, async () => {
      const context: PluginContext = {
        generator: this,
        options: data as any,
        templateName,
        data,
        outputDir: this.options.outputDir,
        config: this.options.config
      }

      try {
        logger.info(`开始生成: ${templateName}`, { data: data.name || data.componentName })

        // 执行生成前钩子
        await this.pluginManager.executeBeforeGenerate(context)

        // 尝试从缓存获取编译后的模板
        const cacheKey = `template:${templateName}`
        let content: string

        const cachedTemplate = cacheManager.getCompiledTemplate(cacheKey)
        if (cachedTemplate) {
          logger.debug('使用缓存的编译模板', { template: templateName })
          content = await this.templateEngine.render(templateName, data)
        } else {
          // 渲染模板
          content = await this.templateEngine.render(templateName, data)
          logger.debug('模板编译完成', { template: templateName })
        }

        // 执行模板渲染钩子
        content = await this.pluginManager.executeOnTemplateRender(context, content)

        // 写入文件
        const outputPath = await this.fileWriter.write(
          data.outputFileName || templateName,
          content,
          this.options.config?.prettier !== false
        )

        const result: GenerateResult = {
          success: true,
          outputPath,
          message: `成功生成文件: ${outputPath}`,
          metadata: {
            templateName,
            timestamp: new Date().toISOString(),
            size: Buffer.byteLength(content, 'utf-8')
          }
        }

        // 执行生成后钩子
        await this.pluginManager.executeAfterGenerate(context, result)

        // 记录历史
        await historyManager.add({
          operation: 'generate',
          templateName,
          files: [{
            path: outputPath,
            action: 'create',
            size: result.metadata?.size || 0
          }],
          metadata: { ...data },
          success: true
        })

        logger.info('生成成功', { outputPath })

        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        logger.error('生成失败', err, { templateName })

        // 执行错误钩子
        await this.pluginManager.executeOnError(context, err)

        // 记录失败的历史
        await historyManager.add({
          operation: 'generate',
          templateName,
          files: [],
          metadata: { ...data },
          success: false,
          error: err.message
        })

        return {
          success: false,
          error: err.message,
          message: '生成失败'
        }
      }
    })
  }

  /**
   * 批量生成
   */
  async generateBatch(items: Array<{ template: string; data: Record<string, any> }>): Promise<GenerateResult[]> {
    const results: GenerateResult[] = []

    for (const item of items) {
      const result = await this.generate(item.template, item.data)
      results.push(result)
    }

    return results
  }
}


