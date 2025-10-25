import { Generator } from './generator'
import type { PageOptions, GenerateResult } from '../types'
import { toPascalCase, toCamelCase, toKebabCase } from '../utils/string-helpers'
import { validateComponentName } from './input-validator'

/**
 * 页面生成器 - 专门用于生成完整页面
 */
export class PageGenerator {
  private generator: Generator

  constructor(templateDir: string, outputDir: string) {
    this.generator = new Generator({ templateDir, outputDir })
  }

  /**
   * 生成 Vue 页面
   */
  async generateVuePage(options: PageOptions): Promise<GenerateResult> {
    validateComponentName(options.name)

    const data = {
      pageName: options.name,
      pascalCase: toPascalCase(options.name),
      camelCase: toCamelCase(options.name),
      kebabCase: toKebabCase(options.name),
      props: options.props || [],
      emits: options.emits || [],
      withScript: options.withScript !== false,
      withStyle: options.withStyle !== false,
      withStore: options.withStore || false,
      withApi: options.withApi || false,
      withTest: options.withTest || false,
      lang: options.lang || 'ts',
      styleType: options.styleType || 'css',
      route: options.route,
      layout: options.layout,
      crudType: options.crudType || 'none',
      description: options.description,
      outputFileName: `${options.name}.vue`
    }

    return await this.generator.generate('vue/page.ejs', data)
  }

  /**
   * 生成 React 页面
   */
  async generateReactPage(options: PageOptions): Promise<GenerateResult> {
    validateComponentName(options.name)

    const data = {
      pageName: options.name,
      pascalCase: toPascalCase(options.name),
      camelCase: toCamelCase(options.name),
      kebabCase: toKebabCase(options.name),
      props: options.props || [],
      withStyle: options.withStyle !== false,
      withStore: options.withStore || false,
      withApi: options.withApi || false,
      withTest: options.withTest || false,
      lang: options.lang || 'tsx',
      styleType: options.styleType || 'css',
      route: options.route,
      framework: 'react',
      crudType: options.crudType || 'none',
      description: options.description,
      outputFileName: `${toPascalCase(options.name)}.${options.lang || 'tsx'}`
    }

    return await this.generator.generate('react/page.ejs', data)
  }

  /**
   * 生成完整的 CRUD 页面集合
   */
  async generateCrudPages(options: {
    name: string
    type: 'vue' | 'react'
    withApi?: boolean
    withStore?: boolean
    lang?: 'ts' | 'js' | 'tsx' | 'jsx'
  }): Promise<GenerateResult[]> {
    const results: GenerateResult[] = []
    const { name, type, withApi = true, withStore = true, lang } = options

    // 生成列表页
    const listOptions: PageOptions = {
      name: `${name}List`,
      crudType: 'list',
      withApi,
      withStore,
      lang,
      route: `/${toKebabCase(name)}`
    }

    // 生成详情页
    const detailOptions: PageOptions = {
      name: `${name}Detail`,
      crudType: 'detail',
      withApi,
      withStore,
      lang,
      route: `/${toKebabCase(name)}/:id`
    }

    // 生成编辑页
    const editOptions: PageOptions = {
      name: `${name}Edit`,
      crudType: 'edit',
      withApi,
      withStore,
      lang,
      route: `/${toKebabCase(name)}/edit/:id`
    }

    // 生成创建页
    const createOptions: PageOptions = {
      name: `${name}Create`,
      crudType: 'create',
      withApi,
      withStore,
      lang,
      route: `/${toKebabCase(name)}/create`
    }

    if (type === 'vue') {
      results.push(await this.generateVuePage(listOptions))
      results.push(await this.generateVuePage(detailOptions))
      results.push(await this.generateVuePage(editOptions))
      results.push(await this.generateVuePage(createOptions))
    } else {
      results.push(await this.generateReactPage(listOptions))
      results.push(await this.generateReactPage(detailOptions))
      results.push(await this.generateReactPage(editOptions))
      results.push(await this.generateReactPage(createOptions))
    }

    return results
  }
}


