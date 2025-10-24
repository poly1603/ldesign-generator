import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PluginManager, definePlugin } from '../../core/plugin-system'
import type { Plugin, PluginContext } from '../../types'

describe('PluginManager', () => {
  let pluginManager: PluginManager

  beforeEach(() => {
    pluginManager = new PluginManager()
  })

  describe('register', () => {
    it('应该成功注册插件', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: '测试插件'
      }

      pluginManager.register(plugin)

      const stats = pluginManager.getStats()
      expect(stats.total).toBe(1)
      expect(stats.plugins[0].name).toBe('test-plugin')
    })

    it('应该拒绝重复注册同名插件', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0'
      }

      pluginManager.register(plugin)

      expect(() => pluginManager.register(plugin)).toThrow('已经注册')
    })

    it('应该批量注册多个插件', () => {
      const plugins: Plugin[] = [
        { name: 'plugin1', version: '1.0.0' },
        { name: 'plugin2', version: '1.0.0' },
        { name: 'plugin3', version: '1.0.0' }
      ]

      pluginManager.registerBatch(plugins)

      const stats = pluginManager.getStats()
      expect(stats.total).toBe(3)
    })
  })

  describe('load/unload', () => {
    beforeEach(() => {
      pluginManager.register({
        name: 'test-plugin',
        version: '1.0.0'
      })
    })

    it('应该成功加载插件', () => {
      pluginManager.load('test-plugin')

      const stats = pluginManager.getStats()
      expect(stats.loaded).toBe(1)
      expect(stats.plugins[0].loaded).toBe(true)
    })

    it('应该拒绝加载未注册的插件', () => {
      expect(() => pluginManager.load('non-existent')).toThrow('未注册')
    })

    it('应该加载所有插件', () => {
      pluginManager.register({ name: 'plugin2', version: '1.0.0' })
      pluginManager.register({ name: 'plugin3', version: '1.0.0' })

      pluginManager.loadAll()

      const stats = pluginManager.getStats()
      expect(stats.loaded).toBe(3)
    })

    it('应该成功卸载插件', () => {
      pluginManager.load('test-plugin')
      pluginManager.unload('test-plugin')

      const stats = pluginManager.getStats()
      expect(stats.loaded).toBe(0)
    })
  })

  describe('getPlugin', () => {
    it('应该获取已注册的插件', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0'
      }

      pluginManager.register(plugin)

      const retrieved = pluginManager.getPlugin('test-plugin')
      expect(retrieved).toBe(plugin)
    })

    it('应该在插件不存在时返回 undefined', () => {
      const retrieved = pluginManager.getPlugin('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('hooks execution', () => {
    let mockContext: PluginContext

    beforeEach(() => {
      mockContext = {
        generator: null,
        options: { name: 'test' },
        templateName: 'test.ejs',
        data: { name: 'test' },
        outputDir: '/output'
      } as any
    })

    it('应该执行 beforeGenerate 钩子', async () => {
      const beforeGenerate = vi.fn()

      pluginManager.register({
        name: 'test-plugin',
        version: '1.0.0',
        hooks: { beforeGenerate }
      })
      pluginManager.load('test-plugin')

      await pluginManager.executeBeforeGenerate(mockContext)

      expect(beforeGenerate).toHaveBeenCalledWith(mockContext)
    })

    it('应该执行 afterGenerate 钩子', async () => {
      const afterGenerate = vi.fn()

      pluginManager.register({
        name: 'test-plugin',
        version: '1.0.0',
        hooks: { afterGenerate }
      })
      pluginManager.load('test-plugin')

      const result = { success: true, message: 'success' }
      await pluginManager.executeAfterGenerate(mockContext, result)

      expect(afterGenerate).toHaveBeenCalledWith(mockContext, result)
    })

    it('应该执行 onError 钩子', async () => {
      const onError = vi.fn()

      pluginManager.register({
        name: 'test-plugin',
        version: '1.0.0',
        hooks: { onError }
      })
      pluginManager.load('test-plugin')

      const error = new Error('test error')
      await pluginManager.executeOnError(mockContext, error)

      expect(onError).toHaveBeenCalledWith(mockContext, error)
    })

    it('应该执行 onTemplateRender 钩子并修改内容', async () => {
      const onTemplateRender = vi.fn((context, content) => content.toUpperCase())

      pluginManager.register({
        name: 'test-plugin',
        version: '1.0.0',
        hooks: { onTemplateRender }
      })
      pluginManager.load('test-plugin')

      const result = await pluginManager.executeOnTemplateRender(mockContext, 'hello')

      expect(onTemplateRender).toHaveBeenCalledWith(mockContext, 'hello')
      expect(result).toBe('HELLO')
    })

    it('应该按顺序执行多个插件的钩子', async () => {
      const order: number[] = []

      pluginManager.registerBatch([
        {
          name: 'plugin1',
          version: '1.0.0',
          hooks: {
            beforeGenerate: async () => { order.push(1) }
          }
        },
        {
          name: 'plugin2',
          version: '1.0.0',
          hooks: {
            beforeGenerate: async () => { order.push(2) }
          }
        },
        {
          name: 'plugin3',
          version: '1.0.0',
          hooks: {
            beforeGenerate: async () => { order.push(3) }
          }
        }
      ])
      pluginManager.loadAll()

      await pluginManager.executeBeforeGenerate(mockContext)

      expect(order).toEqual([1, 2, 3])
    })

    it('应该在钩子抛出错误时停止执行', async () => {
      const plugin1 = vi.fn()
      const plugin2 = vi.fn(() => { throw new Error('error') })
      const plugin3 = vi.fn()

      pluginManager.registerBatch([
        { name: 'plugin1', version: '1.0.0', hooks: { beforeGenerate: plugin1 } },
        { name: 'plugin2', version: '1.0.0', hooks: { beforeGenerate: plugin2 } },
        { name: 'plugin3', version: '1.0.0', hooks: { beforeGenerate: plugin3 } }
      ])
      pluginManager.loadAll()

      await expect(pluginManager.executeBeforeGenerate(mockContext)).rejects.toThrow()

      expect(plugin1).toHaveBeenCalled()
      expect(plugin2).toHaveBeenCalled()
      expect(plugin3).not.toHaveBeenCalled()
    })

    it('应该在 afterGenerate 错误时继续执行其他插件', async () => {
      const plugin1 = vi.fn()
      const plugin2 = vi.fn(() => { throw new Error('error') })
      const plugin3 = vi.fn()

      pluginManager.registerBatch([
        { name: 'plugin1', version: '1.0.0', hooks: { afterGenerate: plugin1 } },
        { name: 'plugin2', version: '1.0.0', hooks: { afterGenerate: plugin2 } },
        { name: 'plugin3', version: '1.0.0', hooks: { afterGenerate: plugin3 } }
      ])
      pluginManager.loadAll()

      const result = { success: true, message: 'success' }
      await pluginManager.executeAfterGenerate(mockContext, result)

      expect(plugin1).toHaveBeenCalled()
      expect(plugin2).toHaveBeenCalled()
      expect(plugin3).toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('应该清空所有插件', () => {
      pluginManager.registerBatch([
        { name: 'plugin1', version: '1.0.0' },
        { name: 'plugin2', version: '1.0.0' }
      ])
      pluginManager.loadAll()

      pluginManager.clear()

      const stats = pluginManager.getStats()
      expect(stats.total).toBe(0)
      expect(stats.loaded).toBe(0)
    })
  })

  describe('getLoadedPlugins', () => {
    it('应该只返回已加载的插件', () => {
      pluginManager.registerBatch([
        { name: 'plugin1', version: '1.0.0' },
        { name: 'plugin2', version: '1.0.0' },
        { name: 'plugin3', version: '1.0.0' }
      ])

      pluginManager.load('plugin1')
      pluginManager.load('plugin3')

      const loaded = pluginManager.getLoadedPlugins()
      expect(loaded).toHaveLength(2)
      expect(loaded.map(p => p.name)).toEqual(['plugin1', 'plugin3'])
    })
  })
})

describe('definePlugin', () => {
  it('应该返回传入的插件对象', () => {
    const plugin: Plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      description: '测试插件'
    }

    const result = definePlugin(plugin)

    expect(result).toBe(plugin)
  })

  it('应该支持完整的插件定义', () => {
    const plugin = definePlugin({
      name: 'test-plugin',
      version: '1.0.0',
      description: '测试插件',
      config: { option: 'value' },
      hooks: {
        beforeGenerate: async () => { },
        afterGenerate: async () => { },
        onError: async () => { },
        onTemplateRender: async (context, content) => content
      }
    })

    expect(plugin.name).toBe('test-plugin')
    expect(plugin.hooks).toBeDefined()
    expect(plugin.config).toEqual({ option: 'value' })
  })
})


