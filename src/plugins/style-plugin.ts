import { definePlugin } from '../core/plugin-system'
import type { Plugin, PluginContext, GenerateResult } from '../types'
import path from 'path'
import fs from 'fs-extra'

/**
 * 样式插件 - 自动生成对应的样式文件
 */
export const stylePlugin: Plugin = definePlugin({
  name: 'style-plugin',
  version: '1.0.0',
  description: '自动生成组件的样式文件',

  hooks: {
    async afterGenerate(context: PluginContext, result: GenerateResult) {
      // 只处理组件和页面
      if (!context.data.withStyle || !result.outputPath) {
        return
      }

      const styleType = context.data.styleType || 'css'
      const componentName = context.data.componentName || context.data.pageName || context.data.name

      if (!componentName) {
        return
      }

      // 生成样式文件
      const styleFileName = getStyleFileName(componentName, styleType, context.templateName)
      const styleFilePath = path.join(path.dirname(result.outputPath), styleFileName)

      // 生成样式内容
      const styleContent = generateStyleContent(componentName, styleType, context)

      try {
        await fs.writeFile(styleFilePath, styleContent, 'utf-8')
        console.log(`✓ 样式文件已生成: ${styleFilePath}`)
      } catch (error) {
        console.error(`样式文件生成失败: ${error}`)
      }
    }
  }
})

/**
 * 获取样式文件名
 */
function getStyleFileName(componentName: string, styleType: string, templateName: string): string {
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  // Vue 文件不需要单独的样式文件（样式在 .vue 文件中）
  if (templateName.includes('.vue')) {
    return `${kebabCase}.${styleType}`
  }

  return `${kebabCase}.${styleType}`
}

/**
 * 生成样式内容
 */
function generateStyleContent(componentName: string, styleType: string, context: PluginContext): string {
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  const isTailwind = context.config?.styleType === 'tailwind'

  if (isTailwind) {
    // Tailwind CSS - 只提供最基础的类名
    return `/* ${componentName} Styles */\n/* 使用 Tailwind CSS 类名进行样式设置 */\n`
  }

  // 根据样式类型生成不同的内容
  if (styleType === 'scss' || styleType === 'less') {
    return `/**
 * ${componentName} Styles
 */
.${kebabCase} {
  // 添加样式
  padding: 0;
  margin: 0;

  &__header {
    // 添加样式
  }

  &__content {
    // 添加样式
  }

  &__footer {
    // 添加样式
  }
}
`
  }

  // CSS
  return `/**
 * ${componentName} Styles
 */
.${kebabCase} {
  padding: 0;
  margin: 0;
}

.${kebabCase}__header {
  /* 添加样式 */
}

.${kebabCase}__content {
  /* 添加样式 */
}

.${kebabCase}__footer {
  /* 添加样式 */
}
`
}

/**
 * CSS Modules 插件
 */
export const cssModulesPlugin: Plugin = definePlugin({
  name: 'css-modules-plugin',
  version: '1.0.0',
  description: '支持 CSS Modules',

  hooks: {
    async afterGenerate(context: PluginContext, result: GenerateResult) {
      if (!context.data.withStyle || !result.outputPath || !context.config?.styleType) {
        return
      }

      const useCssModules = context.config.styleType === 'css-modules'

      if (!useCssModules) {
        return
      }

      const componentName = context.data.componentName || context.data.pageName || context.data.name
      if (!componentName) {
        return
      }

      // 生成 .module.css 文件
      const kebabCase = componentName
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()

      const styleFileName = `${kebabCase}.module.css`
      const styleFilePath = path.join(path.dirname(result.outputPath), styleFileName)

      const styleContent = `/* ${componentName} CSS Modules */
.container {
  padding: 20px;
}

.header {
  font-size: 24px;
  font-weight: 600;
}

.content {
  margin-top: 16px;
}

.footer {
  margin-top: 24px;
}
`

      try {
        await fs.writeFile(styleFilePath, styleContent, 'utf-8')
        console.log(`✓ CSS Modules 文件已生成: ${styleFilePath}`)
      } catch (error) {
        console.error(`CSS Modules 文件生成失败: ${error}`)
      }
    }
  }
})

export default stylePlugin


