import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConfigLoader, createDefaultConfig } from '../../core/config-loader'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

describe('ConfigLoader', () => {
  let tempDir: string
  let configLoader: ConfigLoader

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `config-loader-test-${Date.now()}`)
    await fs.ensureDir(tempDir)
    configLoader = new ConfigLoader()
  })

  afterEach(async () => {
    await fs.remove(tempDir)
    configLoader.clearCache()
  })

  describe('loadConfig', () => {
    it('应该加载 JSON 配置文件', async () => {
      const configPath = path.join(tempDir, '.ldesignrc.json')
      await fs.writeFile(configPath, JSON.stringify({
        defaultLang: 'ts',
        styleType: 'scss',
        prettier: true
      }))

      const config = await configLoader.loadConfig(tempDir)

      expect(config).toBeDefined()
      expect(config?.defaultLang).toBe('ts')
      expect(config?.styleType).toBe('scss')
      expect(config?.prettier).toBe(true)
    })

    it('应该在没有配置文件时返回 null', async () => {
      const config = await configLoader.loadConfig(tempDir)

      expect(config).toBeNull()
    })

    it('应该使用缓存', async () => {
      const configPath = path.join(tempDir, 'ldesign.config.json')
      await fs.writeFile(configPath, JSON.stringify({ defaultLang: 'ts' }))

      // 第一次加载
      const config1 = await configLoader.loadConfig(tempDir)

      // 修改文件但不清除缓存
      await fs.writeFile(configPath, JSON.stringify({ defaultLang: 'js' }))

      // 第二次加载应该使用缓存
      const config2 = await configLoader.loadConfig(tempDir)

      expect(config1?.defaultLang).toBe('ts')
      expect(config2?.defaultLang).toBe('ts') // 仍然是缓存的值
    })

    it('应该在清除缓存后重新加载', async () => {
      const configPath = path.join(tempDir, 'ldesign.config.json')
      await fs.writeFile(configPath, JSON.stringify({ defaultLang: 'ts' }))

      const config1 = await configLoader.loadConfig(tempDir)

      await fs.writeFile(configPath, JSON.stringify({ defaultLang: 'js' }))
      configLoader.clearCache()

      const config2 = await configLoader.loadConfig(tempDir)

      expect(config1?.defaultLang).toBe('ts')
      expect(config2?.defaultLang).toBe('js')
    })
  })

  describe('mergeConfig', () => {
    it('应该合并配置', () => {
      const baseConfig = {
        defaultLang: 'ts' as const,
        styleType: 'css' as const,
        prettier: true
      }

      const userConfig = {
        styleType: 'scss' as const,
        testFramework: 'vitest' as const
      }

      const merged = configLoader.mergeConfig(baseConfig, userConfig)

      expect(merged.defaultLang).toBe('ts')
      expect(merged.styleType).toBe('scss')
      expect(merged.prettier).toBe(true)
      expect(merged.testFramework).toBe('vitest')
    })

    it('应该合并插件数组', () => {
      const plugin1 = { name: 'plugin1', version: '1.0.0' }
      const plugin2 = { name: 'plugin2', version: '1.0.0' }

      const baseConfig = {
        plugins: [plugin1]
      }

      const userConfig = {
        plugins: [plugin2]
      }

      const merged = configLoader.mergeConfig(baseConfig, userConfig)

      expect(merged.plugins).toHaveLength(2)
      expect(merged.plugins?.[0]).toBe(plugin1)
      expect(merged.plugins?.[1]).toBe(plugin2)
    })
  })

  describe('clearCache', () => {
    it('应该清除配置缓存', async () => {
      const configPath = path.join(tempDir, 'ldesign.config.json')
      await fs.writeFile(configPath, JSON.stringify({ defaultLang: 'ts' }))

      await configLoader.loadConfig(tempDir)
      configLoader.clearCache()

      // 缓存应该被清空
      const config = await configLoader.loadConfig(tempDir)
      expect(config?.defaultLang).toBe('ts')
    })
  })
})

describe('createDefaultConfig', () => {
  it('应该返回默认配置', () => {
    const config = createDefaultConfig()

    expect(config).toBeDefined()
    expect(config.nameCase).toBe('pascalCase')
    expect(config.fileStructure).toBe('flat')
    expect(config.defaultLang).toBe('ts')
    expect(config.styleType).toBe('css')
    expect(config.testFramework).toBe('vitest')
    expect(config.prettier).toBe(true)
  })
})


