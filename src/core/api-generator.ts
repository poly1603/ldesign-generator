import { Generator } from './generator'
import type { ApiOptions, GenerateResult } from '../types'
import { toPascalCase, toCamelCase, toKebabCase } from '../utils/string-helpers'

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
      pascalCase: toPascalCase(options.name),
      camelCase: toCamelCase(options.name),
      kebabCase: toKebabCase(options.name),
      baseUrl: options.baseUrl || '/api',
      endpoints: options.endpoints || [],
      withTypes: options.withTypes !== false,
      withMock: options.withMock || false,
      lang: 'ts',
      description: options.description,
      outputFileName: `${toKebabCase(options.name)}.ts`
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
        pascalCase: toPascalCase(name),
        camelCase: toCamelCase(name),
        kebabCase: toKebabCase(name),
        lang: 'ts',
        outputFileName: `${toKebabCase(name)}.types.ts`
      })
    )

    // 如果需要，生成 Mock 数据
    if (withMock) {
      results.push(
        await this.generator.generate('common/mock.ejs', {
          name,
          pascalCase: toPascalCase(name),
          camelCase: toCamelCase(name),
          kebabCase: toKebabCase(name),
          lang: 'ts',
          outputFileName: `${toKebabCase(name)}.mock.ts`
        })
      )
    }

    return results
  }
}


