import ejs from 'ejs'
import Handlebars from 'handlebars'
import fs from 'fs-extra'
import path from 'path'
import type { TemplateMetadata } from '../types'
import { cacheManager } from './cache-manager'
import { ErrorFactory } from './errors'

/**
 * 模板引擎 - 支持 EJS 和 Handlebars，支持模板注册
 */
export class TemplateEngine {
  private customTemplates: Map<string, string> = new Map()
  private templateMetadata: Map<string, TemplateMetadata> = new Map()
  private compiledEjsCache: Map<string, ejs.TemplateFunction> = new Map()
  private compiledHandlebarsCache: Map<string, HandlebarsTemplateDelegate> = new Map()

  constructor(private templateDir: string) {
    this.registerDefaultHelpers()
  }

  /**
   * 渲染模板（优化的缓存版本）
   */
  async render(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      // 1. 获取模板内容（优先从缓存）
      const templateContent = await this.getTemplateContent(templateName)

      // 2. 添加常用的字符串转换函数到数据中
      const enhancedData = this.enhanceTemplateData(data)

      // 3. 根据文件扩展名选择模板引擎并渲染
      const templateType = this.getTemplateType(templateName)
      
      if (templateType === 'ejs') {
        return await this.renderEjs(templateName, templateContent, enhancedData)
      } else if (templateType === 'handlebars') {
        return this.renderHandlebars(templateName, templateContent, enhancedData)
      }

      // 默认使用 EJS
      return await this.renderEjs(templateName, templateContent, enhancedData)
    } catch (error) {
      if (error instanceof Error) {
        throw ErrorFactory.templateSyntaxError(templateName, error)
      }
      throw error
    }
  }

  /**
   * 获取模板内容（带缓存）
   */
  private async getTemplateContent(templateName: string): Promise<string> {
    // 1. 检查自定义模板
    if (this.customTemplates.has(templateName)) {
      return this.customTemplates.get(templateName)!
    }

    // 2. 尝试从缓存获取
    const cacheKey = `template:${templateName}`
    const cachedContent = cacheManager.getTemplate(cacheKey)
    if (cachedContent) {
      return cachedContent
    }

    // 3. 从文件系统读取
    const templatePath = path.join(this.templateDir, templateName)
    if (!(await fs.pathExists(templatePath))) {
      throw ErrorFactory.templateNotFound(templateName)
    }

    const content = await fs.readFile(templatePath, 'utf-8')

    // 4. 缓存模板内容
    cacheManager.setTemplate(cacheKey, content)

    return content
  }

  /**
   * 渲染 EJS 模板（带编译缓存）
   */
  private async renderEjs(
    templateName: string,
    templateContent: string,
    data: Record<string, any>
  ): Promise<string> {
    // 尝试从本地缓存获取编译后的模板
    let compiledTemplate = this.compiledEjsCache.get(templateName)

    if (!compiledTemplate) {
      // 编译模板
      compiledTemplate = ejs.compile(templateContent, {
        filename: templateName,
        cache: true,
        compileDebug: false
      })

      // 缓存编译后的模板
      this.compiledEjsCache.set(templateName, compiledTemplate)
      
      // 同时缓存到全局缓存管理器
      const cacheKey = `compiled:ejs:${templateName}`
      cacheManager.setCompiledTemplate(cacheKey, compiledTemplate)
    }

    // 渲染
    return compiledTemplate(data)
  }

  /**
   * 渲染 Handlebars 模板（带编译缓存）
   */
  private renderHandlebars(
    templateName: string,
    templateContent: string,
    data: Record<string, any>
  ): string {
    // 尝试从本地缓存获取编译后的模板
    let compiledTemplate = this.compiledHandlebarsCache.get(templateName)

    if (!compiledTemplate) {
      // 编译模板
      compiledTemplate = Handlebars.compile(templateContent)

      // 缓存编译后的模板
      this.compiledHandlebarsCache.set(templateName, compiledTemplate)
      
      // 同时缓存到全局缓存管理器
      const cacheKey = `compiled:hbs:${templateName}`
      cacheManager.setCompiledTemplate(cacheKey, compiledTemplate)
    }

    // 渲染
    return compiledTemplate(data)
  }

  /**
   * 增强模板数据（添加辅助函数）
   */
  private enhanceTemplateData(data: Record<string, any>): Record<string, any> {
    return {
      ...data,
      camelCase: this.toCamelCase,
      pascalCase: this.toPascalCase,
      kebabCase: this.toKebabCase,
      snakeCase: this.toSnakeCase,
      upperCase: (str: string) => str.toUpperCase(),
      lowerCase: (str: string) => str.toLowerCase(),
      currentYear: () => new Date().getFullYear(),
      currentDate: () => new Date().toISOString().split('T')[0]
    }
  }

  /**
   * 获取模板类型
   */
  private getTemplateType(templateName: string): 'ejs' | 'handlebars' {
    if (templateName.endsWith('.ejs')) {
      return 'ejs'
    } else if (templateName.endsWith('.hbs') || templateName.endsWith('.handlebars')) {
      return 'handlebars'
    }
    return 'ejs' // 默认
  }

  /**
   * 注册自定义模板
   */
  registerTemplate(name: string, content: string, metadata?: TemplateMetadata): void {
    this.customTemplates.set(name, content)
    if (metadata) {
      this.templateMetadata.set(name, metadata)
    }
    
    // 清除相关缓存
    this.clearTemplateCache(name)
    
    console.log(`✓ 模板 "${name}" 已注册`)
  }

  /**
   * 清除模板缓存
   */
  clearTemplateCache(templateName: string): void {
    // 清除内容缓存
    const contentCacheKey = `template:${templateName}`
    cacheManager.invalidate('template', contentCacheKey)

    // 清除编译缓存
    this.compiledEjsCache.delete(templateName)
    this.compiledHandlebarsCache.delete(templateName)
    
    const ejsCacheKey = `compiled:ejs:${templateName}`
    const hbsCacheKey = `compiled:hbs:${templateName}`
    cacheManager.invalidate('compiled', ejsCacheKey)
    cacheManager.invalidate('compiled', hbsCacheKey)
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.compiledEjsCache.clear()
    this.compiledHandlebarsCache.clear()
    cacheManager.invalidate('template')
    cacheManager.invalidate('compiled')
  }

  /**
   * 预热缓存（预编译常用模板）
   */
  async warmupCache(templateNames: string[]): Promise<void> {
    for (const templateName of templateNames) {
      try {
        // 预加载模板内容
        await this.getTemplateContent(templateName)
        
        // 预编译模板
        const content = await this.getTemplateContent(templateName)
        const type = this.getTemplateType(templateName)
        
        if (type === 'ejs') {
          const compiled = ejs.compile(content, {
            filename: templateName,
            cache: true,
            compileDebug: false
          })
          this.compiledEjsCache.set(templateName, compiled)
        } else {
          const compiled = Handlebars.compile(content)
          this.compiledHandlebarsCache.set(templateName, compiled)
        }
      } catch (error) {
        console.warn(`预热模板 ${templateName} 失败:`, error)
      }
    }
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


