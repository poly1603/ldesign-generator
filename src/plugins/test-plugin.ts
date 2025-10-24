import { definePlugin } from '../core/plugin-system'
import type { Plugin, PluginContext, GenerateResult } from '../types'
import path from 'path'
import fs from 'fs-extra'

/**
 * 测试插件 - 自动生成测试文件
 */
export const testPlugin: Plugin = definePlugin({
  name: 'test-plugin',
  version: '1.0.0',
  description: '自动生成组件和函数的测试文件',

  hooks: {
    async afterGenerate(context: PluginContext, result: GenerateResult) {
      // 检查是否需要生成测试文件
      if (!context.data.withTest || !result.outputPath) {
        return
      }

      const testFramework = context.config?.testFramework || 'vitest'

      if (testFramework === 'none') {
        return
      }

      const componentName = context.data.componentName || context.data.pageName || context.data.name

      if (!componentName) {
        return
      }

      // 确定测试文件路径
      const testFileName = getTestFileName(componentName, context.templateName)
      const testFilePath = path.join(path.dirname(result.outputPath), testFileName)

      // 生成测试内容
      const testContent = generateTestContent(componentName, testFramework, context)

      try {
        await fs.writeFile(testFilePath, testContent, 'utf-8')
        console.log(`✓ 测试文件已生成: ${testFilePath}`)
      } catch (error) {
        console.error(`测试文件生成失败: ${error}`)
      }
    }
  }
})

/**
 * 获取测试文件名
 */
function getTestFileName(componentName: string, templateName: string): string {
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  // 确定文件扩展名
  let ext = '.ts'
  if (templateName.includes('react')) {
    ext = '.tsx'
  } else if (templateName.includes('vue')) {
    ext = '.ts'
  }

  return `${kebabCase}.spec${ext}`
}

/**
 * 生成测试内容
 */
function generateTestContent(componentName: string, testFramework: string, context: PluginContext): string {
  const pascalCase = componentName.charAt(0).toUpperCase() + componentName.slice(1)
  const kebabCase = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  const isVue = context.templateName.includes('vue')
  const isReact = context.templateName.includes('react')
  const isHook = context.templateName.includes('hook') || context.templateName.includes('composable')

  let imports = `import { describe, it, expect, beforeEach } from '${testFramework}'\n`

  if (isVue) {
    imports += `import { mount } from '@vue/test-utils'\n`
    imports += `import ${pascalCase} from './${kebabCase}'\n`
  } else if (isReact) {
    imports += `import { render, screen, fireEvent } from '@testing-library/react'\n`
    imports += `import ${pascalCase} from './${pascalCase}'\n`
  } else if (isHook) {
    imports += `import { ${componentName} } from './${kebabCase}'\n`
  } else {
    imports += `import { ${componentName} } from './${kebabCase}'\n`
  }

  let tests = ''

  if (isVue) {
    tests = `
describe('${componentName}', () => {
  it('should render correctly', () => {
    const wrapper = mount(${pascalCase}, {
      props: {
        // TODO: 添加 props
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should emit events when user interacts', async () => {
    const wrapper = mount(${pascalCase})
    
    // TODO: 触发事件并验证
    // await wrapper.find('button').trigger('click')
    // expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('should update when props change', async () => {
    const wrapper = mount(${pascalCase}, {
      props: {
        // TODO: 初始 props
      }
    })

    await wrapper.setProps({
      // TODO: 更新 props
    })

    // TODO: 验证更新
  })
})
`
  } else if (isReact) {
    tests = `
describe('${componentName}', () => {
  it('should render correctly', () => {
    render(<${pascalCase} />)
    
    // TODO: 添加断言
    // expect(screen.getByText('text')).toBeInTheDocument()
  })

  it('should handle user interactions', () => {
    render(<${pascalCase} />)
    
    // TODO: 模拟用户交互
    // fireEvent.click(screen.getByRole('button'))
  })

  it('should update when props change', () => {
    const { rerender } = render(<${pascalCase} prop="initial" />)
    
    rerender(<${pascalCase} prop="updated" />)
    
    // TODO: 验证更新
  })
})
`
  } else if (isHook) {
    tests = `
describe('${componentName}', () => {
  it('should return initial state', () => {
    const result = ${componentName}()
    
    expect(result).toBeDefined()
    // TODO: 验证初始状态
  })

  it('should execute successfully', async () => {
    const result = ${componentName}()
    
    await result.execute()
    
    // TODO: 验证执行结果
  })

  it('should handle errors gracefully', async () => {
    const result = ${componentName}()
    
    // TODO: 模拟错误并验证错误处理
  })
})
`
  } else {
    tests = `
describe('${componentName}', () => {
  it('should work correctly', () => {
    const result = ${componentName}()
    
    expect(result).toBeDefined()
    // TODO: 添加具体断言
  })

  it('should handle edge cases', () => {
    // TODO: 测试边界情况
  })

  it('should handle errors gracefully', () => {
    // TODO: 测试错误处理
  })
})
`
  }

  return imports + tests
}

export default testPlugin


