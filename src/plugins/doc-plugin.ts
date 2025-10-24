import { definePlugin } from '../core/plugin-system'
import type { Plugin, PluginContext, GenerateResult } from '../types'
import path from 'path'
import fs from 'fs-extra'

/**
 * 文档插件 - 自动生成组件文档
 */
export const docPlugin: Plugin = definePlugin({
  name: 'doc-plugin',
  version: '1.0.0',
  description: '自动生成组件文档和使用示例',
  config: {
    docFormat: 'markdown', // 'markdown' | 'storybook' | 'vitepress'
    includeExample: true
  },

  hooks: {
    async afterGenerate(context: PluginContext, result: GenerateResult) {
      if (!result.outputPath) {
        return
      }

      const componentName = context.data.componentName || context.data.pageName || context.data.name

      if (!componentName) {
        return
      }

      const docFormat = this.config?.docFormat || 'markdown'

      // 生成文档文件
      const docFileName = getDocFileName(componentName, docFormat)
      const docFilePath = path.join(path.dirname(result.outputPath), docFileName)

      // 生成文档内容
      const docContent = generateDocContent(componentName, docFormat, context)

      try {
        await fs.writeFile(docFilePath, docContent, 'utf-8')
        console.log(`✓ 文档文件已生成: ${docFilePath}`)
      } catch (error) {
        console.error(`文档文件生成失败: ${error}`)
      }

      // 如果需要，生成示例文件
      if (this.config?.includeExample) {
        await generateExampleFile(componentName, docFormat, context, result.outputPath)
      }
    }
  }
})

/**
 * 获取文档文件名
 */
function getDocFileName(componentName: string, docFormat: string): string {
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  if (docFormat === 'storybook') {
    return `${kebabCase}.stories.tsx`
  }

  return `${kebabCase}.md`
}

/**
 * 生成文档内容
 */
function generateDocContent(componentName: string, docFormat: string, context: PluginContext): string {
  const pascalCase = componentName.charAt(0).toUpperCase() + componentName.slice(1)
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  const description = context.data.description || `${componentName} 组件`
  const props = context.data.props || []
  const isVue = context.templateName.includes('vue')
  const isReact = context.templateName.includes('react')

  if (docFormat === 'storybook') {
    return generateStorybookDoc(componentName, pascalCase, description, props, isReact)
  }

  // Markdown 文档
  return generateMarkdownDoc(componentName, pascalCase, kebabCase, description, props, isVue, isReact)
}

/**
 * 生成 Storybook 文档
 */
function generateStorybookDoc(componentName: string, pascalCase: string, description: string, props: any[], isReact: boolean): string {
  if (!isReact) {
    return `// Storybook 主要用于 React 组件\n// 请使用 Markdown 格式文档\n`
  }

  return `import type { Meta, StoryObj } from '@storybook/react'
import ${pascalCase} from './${pascalCase}'

/**
 * ${description}
 */
const meta: Meta<typeof ${pascalCase}> = {
  title: 'Components/${pascalCase}',
  component: ${pascalCase},
  tags: ['autodocs'],
  argTypes: {
${props.map(prop => `    ${prop.name}: {
      description: '${prop.name} 属性',
      control: { type: 'text' }
    }`).join(',\n')}
  }
}

export default meta
type Story = StoryObj<typeof ${pascalCase}>

/**
 * 默认示例
 */
export const Default: Story = {
  args: {
${props.filter(p => p.default !== undefined).map(prop => `    ${prop.name}: ${typeof prop.default === 'string' ? `'${prop.default}'` : prop.default}`).join(',\n')}
  }
}

/**
 * 自定义示例
 */
export const Custom: Story = {
  args: {
    // TODO: 自定义 props
  }
}
`
}

/**
 * 生成 Markdown 文档
 */
function generateMarkdownDoc(
  componentName: string,
  pascalCase: string,
  kebabCase: string,
  description: string,
  props: any[],
  isVue: boolean,
  isReact: boolean
): string {
  const propsTable = props.length > 0 ? `
## Props

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
|--------|------|--------|------|------|
${props.map(prop => `| ${prop.name} | \`${prop.type}\` | ${prop.default !== undefined ? `\`${prop.default}\`` : '-'} | ${prop.required !== false ? '是' : '否'} | - |`).join('\n')}
` : ''

  const vueExample = isVue ? `
## 基本用法

\`\`\`vue
<template>
  <${pascalCase}${props.length > 0 ? `\n${props.map(p => `    :${p.name}="${p.name}"`).join('\n')}\n  ` : ' '}/>
</template>

<script setup lang="ts">
import ${pascalCase} from './${kebabCase}'${props.length > 0 ? `
import { ref } from 'vue'

${props.map(p => `const ${p.name} = ref(${p.default !== undefined ? (typeof p.default === 'string' ? `'${p.default}'` : p.default) : 'null'})`).join('\n')}` : ''}
</script>
\`\`\`
` : ''

  const reactExample = isReact ? `
## 基本用法

\`\`\`tsx
import ${pascalCase} from './${pascalCase}'

function App() {
  return (
    <${pascalCase}${props.length > 0 ? `\n${props.map(p => `      ${p.name}={${p.default !== undefined ? (typeof p.default === 'string' ? `'${p.default}'` : p.default) : 'undefined'}}`).join('\n')}\n    ` : ' '}/>
  )
}
\`\`\`
` : ''

  return `# ${componentName}

${description}

${propsTable}
${vueExample}${reactExample}

## 注意事项

- TODO: 添加使用注意事项
- TODO: 添加常见问题

## 示例

更多示例请参考 \`${kebabCase}.example.${isVue ? 'vue' : 'tsx'}\`

## 更新日志

### v1.0.0

- 初始版本
`
}

/**
 * 生成示例文件
 */
async function generateExampleFile(
  componentName: string,
  docFormat: string,
  context: PluginContext,
  outputPath: string
): Promise<void> {
  const pascalCase = componentName.charAt(0).toUpperCase() + componentName.slice(1)
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  const isVue = context.templateName.includes('vue')
  const isReact = context.templateName.includes('react')
  const props = context.data.props || []

  let exampleFileName = ''
  let exampleContent = ''

  if (isVue) {
    exampleFileName = `${kebabCase}.example.vue`
    exampleContent = `<template>
  <div class="example-container">
    <h2>${componentName} 示例</h2>
    
    <section>
      <h3>基本用法</h3>
      <${pascalCase}${props.length > 0 ? ` :${props[0]?.name}="${props[0]?.name}"` : ''} />
    </section>

    <section>
      <h3>高级用法</h3>
      <!-- TODO: 添加高级示例 -->
    </section>
  </div>
</template>

<script setup lang="ts">
import ${pascalCase} from './${kebabCase}'
${props.length > 0 ? `import { ref } from 'vue'

${props.map(p => `const ${p.name} = ref(${p.default !== undefined ? (typeof p.default === 'string' ? `'${p.default}'` : p.default) : 'null'})`).join('\n')}` : ''}
</script>

<style scoped>
.example-container {
  padding: 20px;
}

section {
  margin-bottom: 40px;
}

h3 {
  margin-bottom: 16px;
  color: #333;
}
</style>
`
  } else if (isReact) {
    exampleFileName = `${pascalCase}.example.tsx`
    exampleContent = `import React from 'react'
import ${pascalCase} from './${pascalCase}'

/**
 * ${componentName} 示例
 */
export default function ${pascalCase}Example() {
  return (
    <div className="example-container">
      <h2>${componentName} 示例</h2>
      
      <section>
        <h3>基本用法</h3>
        <${pascalCase}${props.length > 0 ? ` ${props[0]?.name}={${props[0]?.default !== undefined ? (typeof props[0].default === 'string' ? `'${props[0].default}'` : props[0].default) : 'undefined'}}` : ''} />
      </section>

      <section>
        <h3>高级用法</h3>
        {/* TODO: 添加高级示例 */}
      </section>
    </div>
  )
}
`
  }

  if (exampleFileName && exampleContent) {
    const exampleFilePath = path.join(path.dirname(outputPath), exampleFileName)

    try {
      await fs.writeFile(exampleFilePath, exampleContent, 'utf-8')
      console.log(`✓ 示例文件已生成: ${exampleFilePath}`)
    } catch (error) {
      console.error(`示例文件生成失败: ${error}`)
    }
  }
}

export default docPlugin


