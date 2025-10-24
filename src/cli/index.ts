#!/usr/bin/env node

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import boxen from 'boxen'
import path from 'path'
import { ComponentGenerator, PageGenerator, ApiGenerator } from '../core'
import { loadConfig } from '../core/config-loader'
import { stylePlugin, testPlugin, docPlugin } from '../plugins'

const program = new Command()

program
  .name('ldesign-generate')
  .description('LDesign 代码生成器 - 快速生成组件、页面、API 等')
  .version('1.0.0')

// 生成组件
program
  .command('component')
  .alias('c')
  .description('生成 Vue/React 组件')
  .option('-t, --type <type>', '框架类型 (vue/react)', 'vue')
  .option('-n, --name <name>', '组件名称')
  .option('-o, --output <output>', '输出目录')
  .option('--tsx', '生成 TSX 组件（Vue）')
  .option('--class', '生成类组件（React）')
  .option('--no-style', '不生成样式文件')
  .option('--no-test', '不生成测试文件')
  .option('--style-type <type>', '样式类型 (css/scss/less)', 'css')
  .action(async (options) => {
    const spinner = ora('正在生成组件...').start()

    try {
      // 加载配置
      const config = await loadConfig()

      let name = options.name
      let description = ''

      // 交互式输入
      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入组件名称:',
            validate: (input) => input ? true : '组件名称不能为空'
          },
          {
            type: 'input',
            name: 'description',
            message: '请输入组件描述（可选）:'
          },
          {
            type: 'confirm',
            name: 'withStyle',
            message: '是否生成样式文件?',
            default: true
          },
          {
            type: 'confirm',
            name: 'withTest',
            message: '是否生成测试文件?',
            default: false
          }
        ])
        name = answers.name
        description = answers.description
        options.style = answers.withStyle
        options.test = answers.withTest
      }

      const outputDir = options.output || config.outputDir || './src/components'
      const templateDir = path.join(__dirname, '../../templates')

      const generator = new ComponentGenerator(templateDir, outputDir)

      const componentOptions = {
        name,
        description,
        withStyle: options.style !== false,
        withTest: options.test !== false,
        styleType: options.styleType || config.styleType || 'css',
        lang: config.defaultLang || 'ts'
      }

      let result
      if (options.type === 'vue') {
        if (options.tsx) {
          result = await generator.generateVueTsxComponent(componentOptions)
        } else {
          result = await generator.generateVueComponent(componentOptions)
        }
      } else {
        if (options.class) {
          result = await generator.generateReactClassComponent(componentOptions)
        } else {
          result = await generator.generateReactComponent(componentOptions)
        }
      }

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
        console.log(boxen(
          `${chalk.bold('组件已生成'!)}\n\n` +
          `${chalk.gray('文件路径:')} ${result.outputPath}\n` +
          `${chalk.gray('组件名称:')} ${name}\n` +
          `${description ? `${chalk.gray('描述:')} ${description}` : ''}`,
          { padding: 1, borderColor: 'green', borderStyle: 'round' }
        ))
      } else {
        spinner.fail(chalk.red(result.message))
        if (result.error) {
          console.error(chalk.red(result.error))
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('生成失败'))
      console.error(error)
    }
  })

// 生成页面
program
  .command('page')
  .alias('p')
  .description('生成完整页面')
  .option('-t, --type <type>', '框架类型 (vue/react)', 'vue')
  .option('-n, --name <name>', '页面名称')
  .option('-o, --output <output>', '输出目录')
  .option('--crud <type>', 'CRUD 类型 (list/detail/edit/create)')
  .option('--with-api', '生成 API 调用')
  .option('--with-store', '生成状态管理')
  .action(async (options) => {
    const spinner = ora('正在生成页面...').start()

    try {
      const config = await loadConfig()
      let name = options.name

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入页面名称:',
            validate: (input) => input ? true : '页面名称不能为空'
          },
          {
            type: 'list',
            name: 'crudType',
            message: '选择页面类型:',
            choices: [
              { name: '列表页', value: 'list' },
              { name: '详情页', value: 'detail' },
              { name: '编辑页', value: 'edit' },
              { name: '创建页', value: 'create' },
              { name: '自定义', value: 'none' }
            ]
          },
          {
            type: 'confirm',
            name: 'withApi',
            message: '是否生成 API 调用?',
            default: true
          },
          {
            type: 'confirm',
            name: 'withStore',
            message: '是否生成状态管理?',
            default: false
          }
        ])
        name = answers.name
        options.crud = answers.crudType
        options.withApi = answers.withApi
        options.withStore = answers.withStore
      }

      const outputDir = options.output || config.outputDir || './src/pages'
      const templateDir = path.join(__dirname, '../../templates')

      const generator = new PageGenerator(templateDir, outputDir)

      const pageOptions = {
        name,
        crudType: options.crud || 'none',
        withApi: options.withApi || false,
        withStore: options.withStore || false,
        lang: config.defaultLang || 'ts'
      }

      let result
      if (options.type === 'vue') {
        result = await generator.generateVuePage(pageOptions)
      } else {
        result = await generator.generateReactPage(pageOptions)
      }

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
        console.log(boxen(
          `${chalk.bold('页面已生成!')}\n\n` +
          `${chalk.gray('文件路径:')} ${result.outputPath}\n` +
          `${chalk.gray('页面名称:')} ${name}\n` +
          `${chalk.gray('类型:')} ${options.crud || 'custom'}`,
          { padding: 1, borderColor: 'green', borderStyle: 'round' }
        ))
      } else {
        spinner.fail(chalk.red(result.message))
      }
    } catch (error) {
      spinner.fail(chalk.red('生成失败'))
      console.error(error)
    }
  })

// 生成 Hook/Composable
program
  .command('hook')
  .alias('h')
  .description('生成自定义 Hook 或 Composable')
  .option('-t, --type <type>', '框架类型 (vue/react)', 'vue')
  .option('-n, --name <name>', 'Hook 名称')
  .option('-o, --output <output>', '输出目录')
  .option('--async', '异步 Hook')
  .action(async (options) => {
    const spinner = ora('正在生成 Hook...').start()

    try {
      const config = await loadConfig()
      let name = options.name

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入 Hook 名称:',
            validate: (input) => input ? true : 'Hook 名称不能为空'
          },
          {
            type: 'confirm',
            name: 'async',
            message: '是否为异步 Hook?',
            default: false
          }
        ])
        name = answers.name
        options.async = answers.async
      }

      const outputDir = options.output || config.outputDir || './src/hooks'
      const templateDir = path.join(__dirname, '../../templates')

      const generator = new ComponentGenerator(templateDir, outputDir)

      const hookOptions = {
        name,
        type: options.type as 'vue' | 'react',
        async: options.async || false
      }

      let result
      if (options.type === 'vue') {
        result = await generator.generateVueComposable(hookOptions)
      } else {
        result = await generator.generateReactHook(hookOptions)
      }

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
      }
    } catch (error) {
      spinner.fail(chalk.red('生成失败'))
      console.error(error)
    }
  })

// 生成 Store
program
  .command('store')
  .alias('s')
  .description('生成状态管理')
  .option('-t, --type <type>', 'Store 类型 (pinia/vuex/redux/zustand)', 'pinia')
  .option('-n, --name <name>', 'Store 名称')
  .option('-o, --output <output>', '输出目录')
  .action(async (options) => {
    const spinner = ora('正在生成 Store...').start()

    try {
      const config = await loadConfig()
      let name = options.name

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入 Store 名称:',
            validate: (input) => input ? true : 'Store 名称不能为空'
          }
        ])
        name = answers.name
      }

      const outputDir = options.output || config.outputDir || './src/stores'
      const templateDir = path.join(__dirname, '../../templates')

      const generator = new ComponentGenerator(templateDir, outputDir)

      const storeOptions = {
        name,
        type: options.type as 'pinia' | 'vuex' | 'redux' | 'zustand'
      }

      let result
      if (options.type === 'pinia' || options.type === 'vuex') {
        result = await generator.generateVueStore(storeOptions)
      } else {
        result = await generator.generateReactStore(storeOptions)
      }

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
      }
    } catch (error) {
      spinner.fail(chalk.red('生成失败'))
      console.error(error)
    }
  })

// 生成 API
program
  .command('api')
  .alias('a')
  .description('生成 API 请求模块')
  .option('-n, --name <name>', 'API 名称')
  .option('-o, --output <output>', '输出目录')
  .option('--restful', '生成 RESTful API')
  .option('--with-mock', '生成 Mock 数据')
  .action(async (options) => {
    const spinner = ora('正在生成 API...').start()

    try {
      const config = await loadConfig()
      let name = options.name

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入 API 名称:',
            validate: (input) => input ? true : 'API 名称不能为空'
          },
          {
            type: 'confirm',
            name: 'restful',
            message: '是否生成 RESTful API?',
            default: true
          },
          {
            type: 'confirm',
            name: 'withMock',
            message: '是否生成 Mock 数据?',
            default: false
          }
        ])
        name = answers.name
        options.restful = answers.restful
        options.withMock = answers.withMock
      }

      const outputDir = options.output || config.outputDir || './src/api'
      const templateDir = path.join(__dirname, '../../templates')

      const generator = new ApiGenerator(templateDir, outputDir)

      let results
      if (options.restful) {
        results = await generator.generateRestfulApi({
          name,
          resource: name.toLowerCase(),
          withMock: options.withMock
        })
      } else {
        results = [await generator.generateApi({
          name,
          withMock: options.withMock
        })]
      }

      const successCount = results.filter(r => r.success).length
      if (successCount === results.length) {
        spinner.succeed(chalk.green(`成功生成 ${successCount} 个文件`))
      } else {
        spinner.warn(chalk.yellow(`生成完成，${successCount}/${results.length} 个文件成功`))
      }
    } catch (error) {
      spinner.fail(chalk.red('生成失败'))
      console.error(error)
    }
  })

// 初始化配置
program
  .command('init')
  .description('初始化配置文件')
  .action(async () => {
    console.log(chalk.blue('🚀 初始化 LDesign Generator 配置...'))

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'defaultLang',
        message: '选择默认语言:',
        choices: ['ts', 'js'],
        default: 'ts'
      },
      {
        type: 'list',
        name: 'styleType',
        message: '选择样式类型:',
        choices: ['css', 'scss', 'less', 'stylus'],
        default: 'css'
      },
      {
        type: 'list',
        name: 'testFramework',
        message: '选择测试框架:',
        choices: ['vitest', 'jest', 'none'],
        default: 'vitest'
      }
    ])

    const configContent = `/**
 * LDesign Generator 配置文件
 */
export default {
  // 默认语言
  defaultLang: '${answers.defaultLang}',
  
  // 样式类型
  styleType: '${answers.styleType}',
  
  // 测试框架
  testFramework: '${answers.testFramework}',
  
  // 代码格式化
  prettier: true,
  
  // 命名规范
  nameCase: 'pascalCase',
  
  // 文件结构
  fileStructure: 'flat',
  
  // 插件
  plugins: []
}
`

    const fs = await import('fs-extra')
    await fs.writeFile('ldesign.config.js', configContent, 'utf-8')

    console.log(chalk.green('✓ 配置文件已创建: ldesign.config.js'))
  })

program.parse()


