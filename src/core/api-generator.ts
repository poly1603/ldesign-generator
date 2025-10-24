import { Generator } from './generator'
import type { ApiOptions, GenerateResult } from '../types'

/**
 * API 生成器 - 专门用于生成 API 请求模块
 */
export class ApiGenerator {
  private generator: Generator

  constructor(templateDir: string, outputDir: string) {
    this.generator = new Generator({ templateDir, outputDir })
  }

  /**
   * 生成 API 模块
   */
  async generateApi(options: ApiOptions): Promise<GenerateResult> {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      baseUrl: options.baseUrl || '/api',
      endpoints: options.endpoints || [],
      withTypes: options.withTypes !== false,
      withMock: options.withMock || false,
      lang: 'ts',
      description: options.description,
      outputFileName: `${this.toKebabCase(options.name)}.ts`
    }

    return await this.generator.generate('common/api.ejs', data)
  }

  /**
   * 生成 RESTful API
   */
  async generateRestfulApi(options: {
    name: string
    baseUrl?: string
    resource: string
    withMock?: boolean
  }): Promise<GenerateResult[]> {
    const results: GenerateResult[] = []
    const { name, baseUrl, resource, withMock = false } = options

    // 定义标准 RESTful 端点
    const endpoints = [
      {
        name: 'getList',
        method: 'GET' as const,
        path: `/${resource}`,
        params: ['page', 'pageSize', 'filters'],
        response: 'ListResponse'
      },
      {
        name: 'getDetail',
        method: 'GET' as const,
        path: `/${resource}/\${id}`,
        params: ['id'],
        response: 'DetailResponse'
      },
      {
        name: 'create',
        method: 'POST' as const,
        path: `/${resource}`,
        body: 'CreateInput',
        response: 'DetailResponse'
      },
      {
        name: 'update',
        method: 'PUT' as const,
        path: `/${resource}/\${id}`,
        params: ['id'],
        body: 'UpdateInput',
        response: 'DetailResponse'
      },
      {
        name: 'remove',
        method: 'DELETE' as const,
        path: `/${resource}/\${id}`,
        params: ['id'],
        response: 'SuccessResponse'
      }
    ]

    // 生成 API 模块
    results.push(
      await this.generateApi({
        name,
        baseUrl,
        endpoints,
        withTypes: true,
        withMock
      })
    )

    // 如果需要，生成类型定义
    results.push(
      await this.generator.generate('common/types.ejs', {
        name,
        pascalCase: this.toPascalCase(name),
        camelCase: this.toCamelCase(name),
        kebabCase: this.toKebabCase(name),
        lang: 'ts',
        outputFileName: `${this.toKebabCase(name)}.types.ts`
      })
    )

    // 如果需要，生成 Mock 数据
    if (withMock) {
      results.push(
        await this.generator.generate('common/mock.ejs', {
          name,
          pascalCase: this.toPascalCase(name),
          camelCase: this.toCamelCase(name),
          kebabCase: this.toKebabCase(name),
          lang: 'ts',
          outputFileName: `${this.toKebabCase(name)}.mock.ts`
        })
      )
    }

    return results
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
   * 转换为 camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toLowerCase())
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


