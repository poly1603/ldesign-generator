import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TemplateEngine } from '../../core/template-engine'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

describe('TemplateEngine', () => {
  let tempDir: string
  let templateEngine: TemplateEngine

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `template-engine-test-${Date.now()}`)
    await fs.ensureDir(tempDir)
    templateEngine = new TemplateEngine(tempDir)
  })

  afterEach(async () => {
    await fs.remove(tempDir)
  })

  describe('render', () => {
    it('应该渲染 EJS 模板', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.ejs'),
        'Hello <%= name %>!'
      )

      const result = await templateEngine.render('test.ejs', { name: 'World' })

      expect(result).toBe('Hello World!')
    })

    it('应该渲染 Handlebars 模板', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.hbs'),
        'Hello {{name}}!'
      )

      const result = await templateEngine.render('test.hbs', { name: 'World' })

      expect(result).toBe('Hello World!')
    })

    it('应该提供字符串转换助手函数', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.ejs'),
        '<%= pascalCase(str) %> <%= camelCase(str) %> <%= kebabCase(str) %> <%= snakeCase(str) %>'
      )

      const result = await templateEngine.render('test.ejs', { str: 'hello-world' })

      expect(result).toContain('HelloWorld')
      expect(result).toContain('helloWorld')
      expect(result).toContain('hello-world')
      expect(result).toContain('hello_world')
    })

    it('应该支持 Handlebars 助手函数', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.hbs'),
        '{{pascalCase str}} {{camelCase str}} {{kebabCase str}} {{snakeCase str}}'
      )

      const result = await templateEngine.render('test.hbs', { str: 'hello-world' })

      expect(result).toContain('HelloWorld')
      expect(result).toContain('helloWorld')
      expect(result).toContain('hello-world')
      expect(result).toContain('hello_world')
    })

    it('应该在模板文件不存在时抛出错误', async () => {
      await expect(
        templateEngine.render('non-existent.ejs', {})
      ).rejects.toThrow()
    })
  })

  describe('registerTemplate', () => {
    it('应该注册自定义模板', async () => {
      templateEngine.registerTemplate('custom', 'Hello <%= name %>!')

      const result = await templateEngine.render('custom', { name: 'World' })

      expect(result).toBe('Hello World!')
    })

    it('应该注册带元数据的模板', () => {
      templateEngine.registerTemplate(
        'custom',
        'Hello',
        {
          name: 'custom',
          type: 'component',
          description: 'Custom template'
        }
      )

      const metadata = templateEngine.getTemplateMetadata('custom')

      expect(metadata).toBeDefined()
      expect(metadata?.name).toBe('custom')
      expect(metadata?.type).toBe('component')
    })

    it('应该批量注册模板', () => {
      templateEngine.registerTemplates([
        { name: 'template1', content: 'Content 1' },
        { name: 'template2', content: 'Content 2' },
        { name: 'template3', content: 'Content 3' }
      ])

      const templates = templateEngine.getRegisteredTemplates()

      expect(templates).toContain('template1')
      expect(templates).toContain('template2')
      expect(templates).toContain('template3')
    })
  })

  describe('getRegisteredTemplates', () => {
    it('应该返回所有已注册的模板名称', () => {
      templateEngine.registerTemplate('template1', 'Content 1')
      templateEngine.registerTemplate('template2', 'Content 2')

      const templates = templateEngine.getRegisteredTemplates()

      expect(templates).toHaveLength(2)
      expect(templates).toContain('template1')
      expect(templates).toContain('template2')
    })
  })

  describe('getTemplateMetadata', () => {
    it('应该返回模板元数据', () => {
      const metadata = {
        name: 'test',
        type: 'component' as const,
        description: 'Test template'
      }

      templateEngine.registerTemplate('test', 'content', metadata)

      const retrieved = templateEngine.getTemplateMetadata('test')

      expect(retrieved).toEqual(metadata)
    })

    it('应该在模板没有元数据时返回 undefined', () => {
      templateEngine.registerTemplate('test', 'content')

      const metadata = templateEngine.getTemplateMetadata('test')

      expect(metadata).toBeUndefined()
    })
  })

  describe('registerHelper', () => {
    it('应该注册自定义 Handlebars 助手函数', async () => {
      templateEngine.registerHelper('upper', (str: string) => str.toUpperCase())

      await fs.writeFile(
        path.join(tempDir, 'test.hbs'),
        '{{upper name}}'
      )

      const result = await templateEngine.render('test.hbs', { name: 'hello' })

      expect(result).toBe('HELLO')
    })
  })

  describe('built-in helpers', () => {
    it('应该支持条件助手函数', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.hbs'),
        '{{#if (eq a b)}}equal{{else}}not equal{{/if}}'
      )

      const result1 = await templateEngine.render('test.hbs', { a: 5, b: 5 })
      const result2 = await templateEngine.render('test.hbs', { a: 5, b: 10 })

      expect(result1).toBe('equal')
      expect(result2).toBe('not equal')
    })

    it('应该支持数组助手函数', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.hbs'),
        '{{join arr ", "}} ({{length arr}})'
      )

      const result = await templateEngine.render('test.hbs', { arr: ['a', 'b', 'c'] })

      expect(result).toBe('a, b, c (3)')
    })

    it('应该支持日期助手函数', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.hbs'),
        '{{currentYear}}'
      )

      const result = await templateEngine.render('test.hbs', {})

      expect(result).toBe(String(new Date().getFullYear()))
    })
  })
})


