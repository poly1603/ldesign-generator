import chalk from 'chalk'
import inquirer from 'inquirer'
import { Generator } from './generator'
import type { GeneratorOptions } from '../types'
import fs from 'fs-extra'

/**
 * 预览选项
 */
export interface PreviewOptions {
  showLineNumbers?: boolean
  maxLines?: number
  highlight?: boolean
  showDiff?: boolean
  interactive?: boolean
}

/**
 * 预览结果
 */
export interface PreviewResult {
  content: string
  path: string
  exists: boolean
  diff?: string
  approved?: boolean
}

/**
 * 代码预览生成器
 */
export class PreviewGenerator extends Generator {
  constructor(options: GeneratorOptions) {
    super(options)
  }

  /**
   * 生成预览
   */
  async generatePreview(
    templateName: string,
    data: Record<string, any>,
    options?: PreviewOptions
  ): Promise<PreviewResult> {
    const showLineNumbers = options?.showLineNumbers ?? true
    const maxLines = options?.maxLines ?? 100
    const showDiff = options?.showDiff ?? true
    const interactive = options?.interactive ?? false

    // 渲染模板
    const templateEngine = this.getTemplateEngine()
    const content = await templateEngine.render(templateName, data)

    // 确定输出路径
    const path = require('path')
    const fileName = data.outputFileName || templateName.replace('.ejs', '').replace('.hbs', '')
    const outputPath = path.join(
      (this as any).options.outputDir,
      fileName
    )

    // 检查文件是否存在
    const exists = await fs.pathExists(outputPath)

    let diff: string | undefined

    // 如果文件存在且需要 diff
    if (exists && showDiff) {
      const existingContent = await fs.readFile(outputPath, 'utf-8')
      diff = this.generateDiff(existingContent, content)
    }

    // 显示预览
    this.displayPreview(content, {
      ...options,
      showLineNumbers,
      maxLines
    })

    // 如果有 diff，显示 diff
    if (diff) {
      console.log(chalk.bold.yellow('\n📝 与现有文件的差异:'))
      console.log(diff)
    }

    const result: PreviewResult = {
      content,
      path: outputPath,
      exists,
      diff
    }

    // 交互式确认
    if (interactive) {
      const approved = await this.confirmGenerate(result)
      result.approved = approved
    }

    return result
  }

  /**
   * 显示预览
   */
  private displayPreview(content: string, options?: PreviewOptions): void {
    const showLineNumbers = options?.showLineNumbers ?? true
    const maxLines = options?.maxLines ?? 100

    console.log('\n' + chalk.bold.cyan('👁️  代码预览:'))
    console.log(chalk.gray('═'.repeat(80)))

    const lines = content.split('\n')
    const displayLines = lines.slice(0, maxLines)

    displayLines.forEach((line, index) => {
      if (showLineNumbers) {
        const lineNum = String(index + 1).padStart(4, ' ')
        console.log(chalk.gray(lineNum + ' │ ') + this.highlightSyntax(line))
      } else {
        console.log(this.highlightSyntax(line))
      }
    })

    if (lines.length > maxLines) {
      console.log(chalk.gray(`\n... 还有 ${lines.length - maxLines} 行未显示`))
    }

    console.log(chalk.gray('═'.repeat(80)))
  }

  /**
   * 简单的语法高亮
   */
  private highlightSyntax(line: string): string {
    // 简化的语法高亮（实际使用中可以使用专业库如 highlight.js）

    // 关键字
    line = line.replace(
      /\b(import|export|const|let|var|function|class|interface|type|enum|async|await|if|else|for|while|return|new)\b/g,
      chalk.magenta('$1')
    )

    // 字符串
    line = line.replace(
      /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      chalk.green('$&')
    )

    // 注释
    line = line.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/)/,
      chalk.gray('$1')
    )

    // 数字
    line = line.replace(
      /\b(\d+)\b/g,
      chalk.yellow('$1')
    )

    return line
  }

  /**
   * 生成差异对比
   */
  private generateDiff(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')

    const diffLines: string[] = []
    const maxLen = Math.max(oldLines.length, newLines.length)

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i] || ''
      const newLine = newLines[i] || ''

      if (oldLine === newLine) {
        // 相同的行
        diffLines.push(chalk.gray(`  ${i + 1} │ ${oldLine}`))
      } else if (!oldLine) {
        // 新增的行
        diffLines.push(chalk.green(`+ ${i + 1} │ ${newLine}`))
      } else if (!newLine) {
        // 删除的行
        diffLines.push(chalk.red(`- ${i + 1} │ ${oldLine}`))
      } else {
        // 修改的行
        diffLines.push(chalk.red(`- ${i + 1} │ ${oldLine}`))
        diffLines.push(chalk.green(`+ ${i + 1} │ ${newLine}`))
      }
    }

    return diffLines.join('\n')
  }

  /**
   * 确认生成
   */
  private async confirmGenerate(result: PreviewResult): Promise<boolean> {
    console.log('\n' + chalk.bold.cyan('📋 文件信息:'))
    console.log(`  路径: ${result.path}`)
    console.log(`  大小: ${Buffer.byteLength(result.content, 'utf-8')} bytes`)
    console.log(`  状态: ${result.exists ? chalk.yellow('将覆盖现有文件') : chalk.green('新文件')}`)

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作:',
        choices: [
          { name: '✓ 确认生成', value: 'confirm' },
          { name: '✎ 编辑后生成', value: 'edit' },
          { name: '✗ 取消', value: 'cancel' }
        ]
      }
    ])

    if (answer.action === 'cancel') {
      console.log(chalk.yellow('已取消生成'))
      return false
    }

    if (answer.action === 'edit') {
      // TODO: 实现编辑功能（需要临时文件编辑器）
      console.log(chalk.yellow('编辑功能暂未实现，请手动修改生成的文件'))
    }

    return true
  }

  /**
   * 批量预览
   */
  async previewBatch(
    items: Array<{ template: string; data: Record<string, any> }>,
    options?: PreviewOptions
  ): Promise<PreviewResult[]> {
    const results: PreviewResult[] = []

    console.log(chalk.bold.cyan(`\n👁️  批量预览 (${items.length} 项):`))
    console.log(chalk.gray('═'.repeat(80)))

    for (let i = 0; i < items.length; i++) {
      console.log(chalk.bold(`\n[${i + 1}/${items.length}] ${items[i].template}`))

      const result = await this.generatePreview(
        items[i].template,
        items[i].data,
        { ...options, interactive: false }
      )

      results.push(result)
    }

    // 批量确认
    if (options?.interactive) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确认生成这 ${items.length} 个文件吗？`,
          default: true
        }
      ])

      results.forEach(r => {
        r.approved = answer.confirm
      })
    }

    return results
  }

  /**
   * 对比两个版本的代码
   */
  static compareSideBySide(oldContent: string, newContent: string, width: number = 80): void {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const maxLines = Math.max(oldLines.length, newLines.length)

    const halfWidth = Math.floor(width / 2) - 2

    console.log('\n' + chalk.bold.cyan('📊 并排对比:'))
    console.log(chalk.gray('═'.repeat(width)))

    // 标题
    console.log(
      chalk.bold.red('原文件').padEnd(halfWidth) +
      chalk.gray(' │ ') +
      chalk.bold.green('新文件')
    )
    console.log(chalk.gray('─'.repeat(width)))

    // 内容对比
    for (let i = 0; i < Math.min(maxLines, 50); i++) {
      const oldLine = (oldLines[i] || '').slice(0, halfWidth - 4)
      const newLine = (newLines[i] || '').slice(0, halfWidth - 4)

      const oldFormatted = oldLine.padEnd(halfWidth)
      const newFormatted = newLine

      if (oldLine === newLine) {
        console.log(chalk.gray(oldFormatted + ' │ ' + newFormatted))
      } else {
        console.log(chalk.red(oldFormatted) + chalk.gray(' │ ') + chalk.green(newFormatted))
      }
    }

    if (maxLines > 50) {
      console.log(chalk.gray(`\n... 还有 ${maxLines - 50} 行未显示`))
    }

    console.log(chalk.gray('═'.repeat(width) + '\n'))
  }
}

/**
 * 创建预览生成器
 */
export function createPreviewGenerator(options: GeneratorOptions): PreviewGenerator {
  return new PreviewGenerator(options)
}

export default PreviewGenerator


