import ejs from 'ejs'
import Handlebars from 'handlebars'
import fs from 'fs-extra'
import path from 'path'
import type { TemplateMetadata } from '../types'

/**
 * 模板引擎 - 支持 EJS 和 Handlebars，支持模板注册
 */
export class TemplateEngine {
  private customTemplates: Map<string, string> = new Map()
  private templateMetadata: Map<string, TemplateMetadata> = new Map()

  constructor(private templateDir: string) {
    this.registerDefaultHelpers()
  }

  /**
   * 渲染模板
   */
  async render(templateName: string, data: Record<string, any>): Promise<string> {
    let templateContent: string

    // 先检查是否是已注册的自定义模板
    if (this.customTemplates.has(templateName)) {
      templateContent = this.customTemplates.get(templateName)!
    } else {
      // 从文件系统读取模板
      const templatePath = path.join(this.templateDir, templateName)
      if (!(await fs.pathExists(templatePath))) {
        throw new Error(`模板文件不存在: ${templatePath}`)
      }
      templateContent = await fs.readFile(templatePath, 'utf-8')
    }

    // 添加常用的字符串转换函数到数据中
    const enhancedData = {
      ...data,
      camelCase: this.toCamelCase,
      pascalCase: this.toPascalCase,
      kebabCase: this.toKebabCase,
      snakeCase: this.toSnakeCase,
      upperCase: (str: string) => str.toUpperCase(),
      lowerCase: (str: string) => str.toLowerCase()
    }

    // 根据文件扩展名选择模板引擎
    if (templateName.endsWith('.ejs')) {
      return ejs.render(templateContent, enhancedData)
    } else if (templateName.endsWith('.hbs') || templateName.endsWith('.handlebars')) {
      const template = Handlebars.compile(templateContent)
      return template(enhancedData)
    }

    // 默认使用 EJS
    return ejs.render(templateContent, enhancedData)
  }

  /**
   * 注册自定义模板
   */
  registerTemplate(name: string, content: string, metadata?: TemplateMetadata): void {
    this.customTemplates.set(name, content)
    if (metadata) {
      this.templateMetadata.set(name, metadata)
    }
    console.log(`✓ 模板 "${name}" 已注册`)
  }

  /**
   * 批量注册模板
   */
  registerTemplates(templates: Array<{ name: string; content: string; metadata?: TemplateMetadata }>): void {
    for (const template of templates) {
      this.registerTemplate(template.name, template.content, template.metadata)
    }
  }

  /**
   * 获取模板元数据
   */
  getTemplateMetadata(name: string): TemplateMetadata | undefined {
    return this.templateMetadata.get(name)
  }

  /**
   * 获取所有已注册的模板
   */
  getRegisteredTemplates(): string[] {
    return Array.from(this.customTemplates.keys())
  }

  /**
   * 注册 Handlebars 助手函数
   */
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn)
  }

  /**
   * 注册默认的 Handlebars 助手函数
   */
  private registerDefaultHelpers(): void {
    // 字符串转换助手
    Handlebars.registerHelper('camelCase', (str: string) => this.toCamelCase(str))
    Handlebars.registerHelper('pascalCase', (str: string) => this.toPascalCase(str))
    Handlebars.registerHelper('kebabCase', (str: string) => this.toKebabCase(str))
    Handlebars.registerHelper('snakeCase', (str: string) => this.toSnakeCase(str))
    Handlebars.registerHelper('upperCase', (str: string) => str.toUpperCase())
    Handlebars.registerHelper('lowerCase', (str: string) => str.toLowerCase())

    // 条件助手
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b)
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b)
    Handlebars.registerHelper('gt', (a: any, b: any) => a > b)
    Handlebars.registerHelper('lt', (a: any, b: any) => a < b)

    // 数组助手
    Handlebars.registerHelper('join', (arr: any[], separator: string) => arr.join(separator))
    Handlebars.registerHelper('length', (arr: any[]) => arr?.length || 0)

    // 日期助手
    Handlebars.registerHelper('currentYear', () => new Date().getFullYear())
    Handlebars.registerHelper('currentDate', () => new Date().toISOString().split('T')[0])
  }

  /**
   * 转换为 camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toLowerCase())
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase())
  }

  /**
   * 转换为 kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  /**
   * 转换为 snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase()
  }
}


