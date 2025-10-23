import ejs from 'ejs'
import Handlebars from 'handlebars'
import fs from 'fs-extra'
import path from 'path'

/**
 * 模板引擎 - 支持 EJS 和 Handlebars
 */
export class TemplateEngine {
  constructor(private templateDir: string) { }

  /**
   * 渲染模板
   */
  async render(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = path.join(this.templateDir, templateName)
    const templateContent = await fs.readFile(templatePath, 'utf-8')

    // 根据文件扩展名选择模板引擎
    if (templateName.endsWith('.ejs')) {
      return ejs.render(templateContent, data)
    } else if (templateName.endsWith('.hbs') || templateName.endsWith('.handlebars')) {
      const template = Handlebars.compile(templateContent)
      return template(data)
    }

    // 默认使用 EJS
    return ejs.render(templateContent, data)
  }

  /**
   * 注册 Handlebars 助手函数
   */
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn)
  }
}


