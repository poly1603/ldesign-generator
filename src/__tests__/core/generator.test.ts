import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Generator } from '../../core/generator'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

describe('Generator', () => {
  let tempDir: string
  let templateDir: string
  let outputDir: string

  beforeEach(async () => {
    // 创建临时目录
    tempDir = path.join(os.tmpdir(), `generator-test-${Date.now()}`)
    templateDir = path.join(tempDir, 'templates')
    outputDir = path.join(tempDir, 'output')

    await fs.ensureDir(templateDir)
    await fs.ensureDir(outputDir)

    // 创建测试模板
    await fs.writeFile(
      path.join(templateDir, 'test.ejs'),
      'Hello <%= name %>!'
    )
  })

  afterEach(async () => {
    // 清理临时目录
    await fs.remove(tempDir)
  })

  describe('constructor', () => {
    it('应该成功创建 Generator 实例', () => {
      const generator = new Generator({
        templateDir,
        outputDir
      })

      expect(generator).toBeDefined()
      expect(generator.getTemplateEngine()).toBeDefined()
      expect(generator.getPluginManager()).toBeDefined()
    })

    it('应该注册和加载插件', () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {}
      }

      const generator = new Generator({
        templateDir,
        outputDir,
        plugins: [mockPlugin]
      })

      const pluginManager = generator.getPluginManager()
      const stats = pluginManager.getStats()

      expect(stats.total).toBe(1)
      expect(stats.loaded).toBe(1)
    })
  })

  describe('generate', () => {
    it('应该成功生成文件', async () => {
      const generator = new Generator({
        templateDir,
        outputDir
      })

      const result = await generator.generate('test.ejs', {
        name: 'World',
        outputFileName: 'test.txt'
      })

      expect(result.success).toBe(true)
      expect(result.outputPath).toBeDefined()
      expect(result.message).toContain('成功生成文件')

      // 验证文件内容
      const content = await fs.readFile(result.outputPath!, 'utf-8')
      expect(content).toContain('Hello World!')
    })

    it('应该在模板不存在时返回错误', async () => {
      const generator = new Generator({
        templateDir,
        outputDir
      })

      const result = await generator.generate('non-existent.ejs', {
        outputFileName: 'test.txt'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('应该执行插件钩子', async () => {
      const beforeGenerate = vi.fn()
      const afterGenerate = vi.fn()
      const onTemplateRender = vi.fn((context, content) => content.toUpperCase())

      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          beforeGenerate,
          afterGenerate,
          onTemplateRender
        }
      }

      const generator = new Generator({
        templateDir,
        outputDir,
        plugins: [mockPlugin]
      })

      await generator.generate('test.ejs', {
        name: 'World',
        outputFileName: 'test.txt'
      })

      expect(beforeGenerate).toHaveBeenCalled()
      expect(afterGenerate).toHaveBeenCalled()
      expect(onTemplateRender).toHaveBeenCalled()
    })

    it('应该在发生错误时执行错误钩子', async () => {
      const onError = vi.fn()

      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          onError
        }
      }

      const generator = new Generator({
        templateDir,
        outputDir,
        plugins: [mockPlugin]
      })

      await generator.generate('non-existent.ejs', {
        outputFileName: 'test.txt'
      })

      expect(onError).toHaveBeenCalled()
    })
  })

  describe('generateBatch', () => {
    it('应该批量生成多个文件', async () => {
      const generator = new Generator({
        templateDir,
        outputDir
      })

      const items = [
        { template: 'test.ejs', data: { name: 'World1', outputFileName: 'test1.txt' } },
        { template: 'test.ejs', data: { name: 'World2', outputFileName: 'test2.txt' } },
        { template: 'test.ejs', data: { name: 'World3', outputFileName: 'test3.txt' } }
      ]

      const results = await generator.generateBatch(items)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.success)).toBe(true)

      // 验证文件都被创建
      for (let i = 0; i < 3; i++) {
        const content = await fs.readFile(results[i].outputPath!, 'utf-8')
        expect(content).toContain(`World${i + 1}`)
      }
    })

    it('应该处理批量生成中的部分失败', async () => {
      const generator = new Generator({
        templateDir,
        outputDir
      })

      const items = [
        { template: 'test.ejs', data: { name: 'World1', outputFileName: 'test1.txt' } },
        { template: 'non-existent.ejs', data: { name: 'World2', outputFileName: 'test2.txt' } },
        { template: 'test.ejs', data: { name: 'World3', outputFileName: 'test3.txt' } }
      ]

      const results = await generator.generateBatch(items)

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })
  })

  describe('config', () => {
    it('应该使用配置中的 prettier 设置', async () => {
      const generator = new Generator({
        templateDir,
        outputDir,
        config: {
          prettier: false
        }
      })

      const result = await generator.generate('test.ejs', {
        name: 'World',
        outputFileName: 'test.txt'
      })

      expect(result.success).toBe(true)
    })
  })
})

