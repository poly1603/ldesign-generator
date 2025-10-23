#!/usr/bin/env node

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { ComponentGenerator } from '../core'

const program = new Command()

program
  .name('ldesign-generate')
  .description('LDesign 代码生成器')
  .version('0.1.0')

program
  .command('component')
  .description('生成组件')
  .option('-t, --type <type>', '组件类型 (vue/react)', 'vue')
  .option('-n, --name <name>', '组件名称')
  .option('-o, --output <output>', '输出目录', './src/components')
  .action(async (options) => {
    const spinner = ora('正在生成组件...').start()

    try {
      let name = options.name

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '请输入组件名称:',
            validate: (input) => input ? true : '组件名称不能为空'
          }
        ])
        name = answers.name
      }

      const generator = new ComponentGenerator(
        './templates',
        options.output
      )

      let result
      if (options.type === 'vue') {
        result = await generator.generateVueComponent({ name })
      } else {
        result = await generator.generateReactComponent({ name })
      }

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
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

program
  .command('init')
  .description('初始化项目')
  .action(async () => {
    console.log(chalk.blue('🚀 初始化项目...'))
    // TODO: 实现项目初始化
  })

program.parse()


