/**
 * Generator 基础使用示例
 */

import {
  ComponentGenerator,
  PageGenerator,
  ApiGenerator,
  logger,
  LogLevel
} from '../src'

async function main() {
  // 配置日志
  logger.setLevel(LogLevel.INFO)

  console.log('🚀 Generator 基础使用示例\n')

  // 1. 生成 Vue 组件
  console.log('1️⃣  生成 Vue 组件...')
  const vueGen = new ComponentGenerator('./templates', './output/vue')

  const vueResult = await vueGen.generateVueComponent({
    name: 'MyButton',
    props: [
      { name: 'type', type: 'string', default: 'primary' },
      { name: 'size', type: "'small' | 'medium' | 'large'", default: 'medium' }
    ],
    emits: ['click'],
    withStyle: true,
    styleType: 'scss',
    lang: 'ts',
    description: '自定义按钮组件'
  })

  console.log(`✓ ${vueResult.message}\n`)

  // 2. 生成 React 组件
  console.log('2️⃣  生成 React 组件...')
  const reactGen = new ComponentGenerator('./templates', './output/react')

  const reactResult = await reactGen.generateReactComponent({
    name: 'MyInput',
    props: [
      { name: 'value', type: 'string' },
      { name: 'onChange', type: '(value: string) => void' }
    ],
    withStyle: true,
    lang: 'tsx',
    description: '自定义输入框组件'
  })

  console.log(`✓ ${reactResult.message}\n`)

  // 3. 生成页面
  console.log('3️⃣  生成 Vue 页面...')
  const pageGen = new PageGenerator('./templates', './output/pages')

  const pageResult = await pageGen.generateVuePage({
    name: 'UserList',
    crudType: 'list',
    withApi: true,
    withStore: true,
    route: '/users',
    lang: 'ts'
  })

  console.log(`✓ ${pageResult.message}\n`)

  // 4. 生成 API
  console.log('4️⃣  生成 RESTful API...')
  const apiGen = new ApiGenerator('./templates', './output/api')

  const apiResults = await apiGen.generateRestfulApi({
    name: 'user',
    resource: 'users',
    withMock: true
  })

  console.log(`✓ 生成了 ${apiResults.length} 个文件\n`)

  console.log('🎉 所有示例生成完成！')
}

main().catch(console.error)

