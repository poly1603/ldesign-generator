import type { GeneratorOptions, GenerateResult } from '../types'
import { TemplateEngine } from './template-engine'
import { FileWriter } from './file-writer'

/**
 * 代码生成器主类
 */
export class Generator {
  private templateEngine: TemplateEngine
  private fileWriter: FileWriter

  constructor(private options: GeneratorOptions) {
    this.templateEngine = new TemplateEngine(options.templateDir)
    this.fileWriter = new FileWriter(options.outputDir)
  }

  /**
   * 生成代码
   */
  async generate(templateName: string, data: Record<string, any>): Promise<GenerateResult> {
    try {
      // 渲染模板
      const content = await this.templateEngine.render(templateName, data)

      // 写入文件
      const outputPath = await this.fileWriter.write(
        data.outputFileName || templateName,
        content
      )

      return {
        success: true,
        outputPath,
        message: `成功生成文件: ${outputPath}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: '生成失败'
      }
    }
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


