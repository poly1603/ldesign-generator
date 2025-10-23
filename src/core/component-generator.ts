import { Generator } from './generator'
import type { ComponentOptions } from '../types'

/**
 * 组件生成器 - 专门用于生成 Vue/React 组件
 */
export class ComponentGenerator {
  private generator: Generator

  constructor(templateDir: string, outputDir: string) {
    this.generator = new Generator({ templateDir, outputDir })
  }

  /**
   * 生成 Vue 组件
   */
  async generateVueComponent(options: ComponentOptions) {
    const data = {
      componentName: options.name,
      pascalCase: this.toPascalCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      props: options.props || [],
      emits: options.emits || [],
      withScript: options.withScript !== false,
      withStyle: options.withStyle !== false,
      lang: options.lang || 'ts',
      outputFileName: `${options.name}.vue`
    }

    return await this.generator.generate('vue-component.ejs', data)
  }

  /**
   * 生成 React 组件
   */
  async generateReactComponent(options: ComponentOptions) {
    const data = {
      componentName: this.toPascalCase(options.name),
      props: options.props || [],
      withTypes: options.withTypes !== false,
      withStyles: options.withStyle !== false,
      lang: options.lang || 'tsx',
      outputFileName: `${this.toPascalCase(options.name)}.${options.lang || 'tsx'}`
    }

    return await this.generator.generate('react-component.ejs', data)
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
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
}


