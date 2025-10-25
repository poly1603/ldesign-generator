/**
 * 自定义插件开发示例
 */

import {
  definePlugin,
  Generator,
  type Plugin,
  type PluginContext,
  type GenerateResult
} from '../src'
import fs from 'fs-extra'
import path from 'path'

// ========== 示例 1: 版权信息插件 ==========

const copyrightPlugin = definePlugin({
  name: 'copyright-plugin',
  version: '1.0.0',
  description: '自动添加版权信息',
  
  config: {
    company: 'Your Company',
    year: new Date().getFullYear()
  },
  
  hooks: {
    onTemplateRender(context, content) {
      const config = this.config as { company: string; year: number }
      
      const copyright = `/**
 * Copyright (c) ${config.year} ${config.company}
 * All rights reserved.
 */

`
      return copyright + content
    }
  }
})

// ========== 示例 2: Git 自动提交插件 ==========

const gitPlugin = definePlugin({
  name: 'git-plugin',
  version: '1.0.0',
  description: '自动将生成的文件添加到 Git',
  
  config: {
    autoCommit: true,
    commitMessage: 'chore: generate {name}'
  },
  
  hooks: {
    async afterGenerate(context, result) {
      if (!result.success || !result.outputPath) {
        return
      }
      
      const config = this.config as { autoCommit: boolean; commitMessage: string }
      
      if (!config.autoCommit) {
        return
      }
      
      try {
        // 检查是否在 Git 仓库中
        const { execSync } = require('child_process')
        execSync('git rev-parse --git-dir', { stdio: 'ignore' })
        
        // Git add
        execSync(`git add ${result.outputPath}`)
        console.log(`✓ 文件已添加到 Git: ${result.outputPath}`)
        
        // Git commit
        const componentName = context.data.componentName || context.data.name
        const message = config.commitMessage.replace('{name}', componentName)
        execSync(`git commit -m "${message}"`, { stdio: 'ignore' })
        console.log(`✓ 已提交: ${message}`)
      } catch (error) {
        console.warn('Git 操作失败（可能不在 Git 仓库中）')
      }
    }
  }
})

// ========== 示例 3: 代码规范检查插件 ==========

const lintPlugin = definePlugin({
  name: 'lint-plugin',
  version: '1.0.0',
  description: '自动运行 ESLint 检查生成的代码',
  
  hooks: {
    async afterGenerate(context, result) {
      if (!result.success || !result.outputPath) {
        return
      }
      
      try {
        const { execSync } = require('child_process')
        
        // 运行 ESLint
        execSync(`npx eslint ${result.outputPath} --fix`, {
          stdio: 'ignore'
        })
        
        console.log(`✓ ESLint 检查和修复完成: ${result.outputPath}`)
      } catch (error) {
        console.warn('ESLint 检查失败，请手动检查代码')
      }
    }
  }
})

// ========== 示例 4: 统计插件 ==========

const statsPlugin = definePlugin({
  name: 'stats-plugin',
  version: '1.0.0',
  description: '收集生成统计信息',
  
  config: {
    stats: {
      totalFiles: 0,
      totalSize: 0,
      byType: {} as Record<string, number>
    }
  },
  
  hooks: {
    async afterGenerate(context, result) {
      if (!result.success) {
        return
      }
      
      const config = this.config as {
        stats: {
          totalFiles: number
          totalSize: number
          byType: Record<string, number>
        }
      }
      
      // 更新统计
      config.stats.totalFiles++
      
      if (result.metadata?.size) {
        config.stats.totalSize += result.metadata.size
      }
      
      const type = context.templateName.split('/')[0]
      config.stats.byType[type] = (config.stats.byType[type] || 0) + 1
    }
  }
})

// ========== 示例 5: 通知插件 ==========

const notificationPlugin = definePlugin({
  name: 'notification-plugin',
  version: '1.0.0',
  description: '生成完成后发送通知',
  
  config: {
    method: 'console' // 'console' | 'webhook' | 'email'
  },
  
  hooks: {
    async afterGenerate(context, result) {
      const config = this.config as { method: string; webhookUrl?: string }
      
      if (result.success) {
        if (config.method === 'console') {
          console.log(`🔔 通知: ${context.data.componentName || context.data.name} 已生成`)
        } else if (config.method === 'webhook' && config.webhookUrl) {
          // 发送 webhook
          try {
            await fetch(config.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'file-generated',
                file: result.outputPath,
                timestamp: new Date().toISOString()
              })
            })
          } catch (error) {
            console.warn('Webhook 发送失败')
          }
        }
      }
    }
  }
})

// ========== 示例 6: 文档生成插件 ==========

const autoDocPlugin = definePlugin({
  name: 'auto-doc-plugin',
  version: '1.0.0',
  description: '自动生成组件文档',
  
  hooks: {
    async afterGenerate(context, result) {
      if (!result.success || !result.outputPath) {
        return
      }
      
      // 只为组件生成文档
      if (!context.templateName.includes('component')) {
        return
      }
      
      const componentName = context.data.componentName
      const props = context.data.props || []
      const emits = context.data.emits || []
      
      // 生成 Markdown 文档
      const docContent = `# ${componentName}

${context.data.description || '组件描述'}

## Props

${props.length > 0 ? props.map((p: any) => 
  `- \`${p.name}\` (\`${p.type}\`)${p.default ? ` - 默认: ${p.default}` : ''}`
).join('\n') : '无'}

## Events

${emits.length > 0 ? emits.map((e: string) => `- \`${e}\``).join('\n') : '无'}

## 使用示例

\`\`\`vue
<template>
  <${componentName} />
</template>
\`\`\`
`
      
      const docPath = result.outputPath.replace(/\.(vue|tsx?|jsx?)$/, '.md')
      await fs.writeFile(docPath, docContent, 'utf-8')
      console.log(`✓ 文档已生成: ${docPath}`)
    }
  }
})

// ========== 使用示例 ==========

async function main() {
  console.log('🔌 自定义插件开发示例\n')
  
  // 1. 使用单个插件
  console.log('1️⃣ 使用版权插件...\n')
  
  const generator1 = new Generator({
    templateDir: './templates',
    outputDir: './output/with-copyright',
    plugins: [copyrightPlugin]
  })
  
  await generator1.generate('vue/component.ejs', {
    componentName: 'MyButton'
  })
  
  console.log('✅ 生成的文件将包含版权信息\n')
  
  // 2. 组合多个插件
  console.log('2️⃣ 组合多个插件...\n')
  
  const generator2 = new Generator({
    templateDir: './templates',
    outputDir: './output/with-plugins',
    plugins: [
      copyrightPlugin,
      statsPlugin,
      autoDocPlugin,
      notificationPlugin
    ]
  })
  
  await generator2.generate('vue/component.ejs', {
    componentName: 'ComplexButton',
    props: [
      { name: 'type', type: 'string', default: 'primary' },
      { name: 'size', type: 'string', default: 'medium' }
    ],
    emits: ['click'],
    description: '复杂按钮组件'
  })
  
  // 查看统计
  const pluginManager = generator2.getPluginManager()
  const stats = pluginManager.getPlugin('stats-plugin')
  console.log('\n📊 生成统计:', stats?.config)
  
  console.log('\n🎉 插件示例完成！')
}

main().catch(console.error)

