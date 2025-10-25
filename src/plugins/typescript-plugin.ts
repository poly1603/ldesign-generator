/**
 * TypeScript 插件
 * 自动生成 TypeScript 类型定义文件
 */

import { definePlugin } from '../core/plugin-system'
import type { Plugin, PluginContext, GenerateResult } from '../types'
import path from 'path'
import fs from 'fs-extra'
import { toKebabCase, toPascalCase } from '../utils/string-helpers'

/**
 * TypeScript 插件配置
 */
export interface TypeScriptPluginConfig {
  /**
   * 是否自动生成 .d.ts 文件
   */
  generateDeclarations?: boolean
  
  /**
   * 是否生成接口定义
   */
  generateInterfaces?: boolean
  
  /**
   * 类型文件的命名模式
   */
  typeFilePattern?: 'kebab-case' | 'pascal-case'
}

/**
 * TypeScript 插件
 */
export const typescriptPlugin: Plugin = definePlugin({
  name: 'typescript-plugin',
  version: '1.0.0',
  description: '自动生成 TypeScript 类型定义文件',
  
  config: {
    generateDeclarations: true,
    generateInterfaces: true,
    typeFilePattern: 'kebab-case'
  } as TypeScriptPluginConfig,

  hooks: {
    async afterGenerate(context: PluginContext, result: GenerateResult) {
      const config = this.config as TypeScriptPluginConfig
      
      // 只处理需要类型定义的情况
      if (!context.data.withTypes || !result.outputPath) {
        return
      }

      const componentName = context.data.componentName || context.data.pageName || context.data.name

      if (!componentName) {
        return
      }

      // 生成类型定义文件
      if (config.generateInterfaces) {
        await generateTypeDefinitionFile(componentName, result.outputPath, context, config)
      }
    }
  }
})

/**
 * 生成类型定义文件
 */
async function generateTypeDefinitionFile(
  componentName: string,
  outputPath: string,
  context: PluginContext,
  config: TypeScriptPluginConfig
): Promise<void> {
  const fileName = config.typeFilePattern === 'pascal-case' 
    ? toPascalCase(componentName)
    : toKebabCase(componentName)
    
  const typeFileName = `${fileName}.types.ts`
  const typeFilePath = path.join(path.dirname(outputPath), typeFileName)

  // 检查是否已存在
  if (await fs.pathExists(typeFilePath)) {
    console.log(`ℹ️  类型文件已存在，跳过: ${typeFilePath}`)
    return
  }

  const typeContent = generateTypeContent(componentName, context)

  try {
    await fs.writeFile(typeFilePath, typeContent, 'utf-8')
    console.log(`✓ TypeScript 类型文件已生成: ${typeFilePath}`)
  } catch (error) {
    console.error(`TypeScript 类型文件生成失败: ${error}`)
  }
}

/**
 * 生成类型内容
 */
function generateTypeContent(componentName: string, context: PluginContext): string {
  const pascalName = toPascalCase(componentName)
  const props = context.data.props || []
  
  let content = `/**
 * ${componentName} 类型定义
 */

`

  // 生成 Props 接口
  if (props.length > 0) {
    content += `/**
 * ${pascalName} 组件 Props
 */
export interface ${pascalName}Props {
`
    props.forEach((prop: any) => {
      const required = prop.required !== false ? '' : '?'
      const defaultValue = prop.default ? ` // 默认: ${JSON.stringify(prop.default)}` : ''
      content += `  ${prop.name}${required}: ${prop.type}${defaultValue}\n`
    })
    content += `}\n\n`
  }

  // 生成 Emits 类型
  const emits = context.data.emits || []
  if (emits.length > 0) {
    content += `/**
 * ${pascalName} 组件事件
 */
export interface ${pascalName}Emits {
`
    emits.forEach((emit: string) => {
      content += `  (event: '${emit}', ...args: any[]): void\n`
    })
    content += `}\n\n`
  }

  // 生成 State 接口（如果是 Store）
  const state = context.data.state || []
  if (state.length > 0) {
    content += `/**
 * ${pascalName} Store State
 */
export interface ${pascalName}State {
`
    state.forEach((s: any) => {
      const defaultValue = s.default ? ` // 默认: ${JSON.stringify(s.default)}` : ''
      content += `  ${s.name}: ${s.type}${defaultValue}\n`
    })
    content += `}\n\n`
  }

  // 生成 Actions 类型（如果是 Store）
  const actions = context.data.actions || []
  if (actions.length > 0) {
    content += `/**
 * ${pascalName} Store Actions
 */
export interface ${pascalName}Actions {
`
    actions.forEach((action: string) => {
      content += `  ${action}: (...args: any[]) => any\n`
    })
    content += `}\n\n`
  }

  // 添加默认导出
  content += `export default ${pascalName}Props\n`

  return content
}

/**
 * 严格类型检查插件
 */
export const strictTypePlugin: Plugin = definePlugin({
  name: 'strict-type-plugin',
  version: '1.0.0',
  description: '为生成的代码添加严格类型检查注释',

  hooks: {
    onTemplateRender(context: PluginContext, content: string): string {
      // 在 TypeScript 文件开头添加严格类型检查注释
      if (context.data.lang === 'ts' || context.data.lang === 'tsx') {
        const strictComment = `/**
 * @fileoverview ${context.data.description || context.data.componentName || 'Generated file'}
 * @strict
 */

`
        return strictComment + content
      }

      return content
    }
  }
})

export default typescriptPlugin


