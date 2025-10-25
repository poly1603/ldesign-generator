/**
 * ESLint 插件
 * 为生成的代码添加 ESLint 配置和注释
 */

import { definePlugin } from '../core/plugin-system'
import type { Plugin, PluginContext, GenerateResult } from '../types'
import path from 'path'
import fs from 'fs-extra'

/**
 * ESLint 插件配置
 */
export interface ESLintPluginConfig {
  /**
   * 是否生成 .eslintrc 文件
   */
  generateConfig?: boolean
  
  /**
   * 是否添加 ESLint 禁用注释（用于生成的文件）
   */
  addDisableComments?: boolean
  
  /**
   * 要禁用的规则
   */
  disabledRules?: string[]
}

/**
 * ESLint 插件
 */
export const eslintPlugin: Plugin = definePlugin({
  name: 'eslint-plugin',
  version: '1.0.0',
  description: '为生成的代码添加 ESLint 配置',
  
  config: {
    generateConfig: false,
    addDisableComments: true,
    disabledRules: ['max-lines', '@typescript-eslint/no-explicit-any']
  } as ESLintPluginConfig,

  hooks: {
    onTemplateRender(context: PluginContext, content: string): string {
      const config = this.config as ESLintPluginConfig

      if (!config.addDisableComments) {
        return content
      }

      // 在文件开头添加 ESLint 禁用注释
      const disableComment = generateESLintComment(config.disabledRules || [])
      
      if (disableComment) {
        return disableComment + '\n' + content
      }

      return content
    },

    async afterGenerate(context: PluginContext, result: GenerateResult) {
      const config = this.config as ESLintPluginConfig

      if (!config.generateConfig || !result.outputPath) {
        return
      }

      // 在输出目录生成 .eslintrc.js 文件（如果不存在）
      const outputDir = path.dirname(result.outputPath)
      const eslintrcPath = path.join(outputDir, '.eslintrc.js')

      if (await fs.pathExists(eslintrcPath)) {
        return
      }

      const eslintrcContent = generateESLintConfig(context)

      try {
        await fs.writeFile(eslintrcPath, eslintrcContent, 'utf-8')
        console.log(`✓ ESLint 配置文件已生成: ${eslintrcPath}`)
      } catch (error) {
        console.error(`ESLint 配置文件生成失败: ${error}`)
      }
    }
  }
})

/**
 * 生成 ESLint 注释
 */
function generateESLintComment(rules: string[]): string {
  if (!rules || rules.length === 0) {
    return ''
  }

  return `/* eslint-disable ${rules.join(', ')} */`
}

/**
 * 生成 ESLint 配置
 */
function generateESLintConfig(context: PluginContext): string {
  const isTypeScript = context.data.lang === 'ts' || context.data.lang === 'tsx'
  const isReact = context.templateName.includes('react')
  const isVue = context.templateName.includes('vue')

  return `/**
 * ESLint 配置文件
 * 由 @ldesign/generator 自动生成
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  ${isTypeScript ? `parser: '@typescript-eslint/parser',` : ''}
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ${isTypeScript ? `project: './tsconfig.json',` : ''}
    ${isReact ? `ecmaFeatures: { jsx: true },` : ''}
  },
  extends: [
    'eslint:recommended',
    ${isTypeScript ? `'plugin:@typescript-eslint/recommended',` : ''}
    ${isReact ? `'plugin:react/recommended',` : ''}
    ${isReact ? `'plugin:react-hooks/recommended',` : ''}
    ${isVue ? `'plugin:vue/vue3-recommended',` : ''}
  ],
  plugins: [
    ${isTypeScript ? `'@typescript-eslint',` : ''}
    ${isReact ? `'react',` : ''}
    ${isVue ? `'vue',` : ''}
  ],
  rules: {
    // 根据需要自定义规则
    'no-console': 'warn',
    'no-debugger': 'warn',
    ${isTypeScript ? `'@typescript-eslint/no-explicit-any': 'warn',` : ''}
    ${isTypeScript ? `'@typescript-eslint/no-unused-vars': 'warn',` : ''}
  }
}
`
}

/**
 * Prettier 集成插件
 */
export const prettierPlugin: Plugin = definePlugin({
  name: 'prettier-plugin',
  version: '1.0.0',
  description: '为生成的代码添加 Prettier 配置',

  config: {
    generateConfig: false
  },

  hooks: {
    async afterGenerate(context: PluginContext, result: GenerateResult) {
      const config = this.config as { generateConfig?: boolean }

      if (!config.generateConfig || !result.outputPath) {
        return
      }

      const outputDir = path.dirname(result.outputPath)
      const prettierrcPath = path.join(outputDir, '.prettierrc')

      if (await fs.pathExists(prettierrcPath)) {
        return
      }

      const prettierrcContent = JSON.stringify({
        semi: false,
        singleQuote: true,
        trailingComma: 'none',
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        arrowParens: 'avoid',
        endOfLine: 'lf'
      }, null, 2)

      try {
        await fs.writeFile(prettierrcPath, prettierrcContent, 'utf-8')
        console.log(`✓ Prettier 配置文件已生成: ${prettierrcPath}`)
      } catch (error) {
        console.error(`Prettier 配置文件生成失败: ${error}`)
      }
    }
  }
})

export default eslintPlugin


