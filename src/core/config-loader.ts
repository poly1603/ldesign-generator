import path from 'path'
import fs from 'fs-extra'
import type { GeneratorConfig, Plugin } from '../types'

/**
 * 配置文件名列表
 */
const CONFIG_FILES = [
  'ldesign.config.js',
  'ldesign.config.ts',
  'ldesign.config.mjs',
  'ldesign.config.cjs',
  '.ldesignrc.js',
  '.ldesignrc.ts',
  '.ldesignrc.json'
]

/**
 * 完整配置接口
 */
export interface FullConfig extends GeneratorConfig {
  templateDir?: string
  outputDir?: string
  plugins?: Plugin[]
}

/**
 * 配置加载器
 */
export class ConfigLoader {
  private configCache: Map<string, FullConfig> = new Map()

  /**
   * 加载配置文件
   */
  async loadConfig(searchPath: string = process.cwd()): Promise<FullConfig | null> {
    // 检查缓存
    if (this.configCache.has(searchPath)) {
      return this.configCache.get(searchPath)!
    }

    // 查找配置文件
    const configFile = await this.findConfigFile(searchPath)

    if (!configFile) {
      return null
    }

    try {
      const config = await this.parseConfigFile(configFile)

      // 验证配置
      const validatedConfig = this.validateConfig(config)

      // 缓存配置
      this.configCache.set(searchPath, validatedConfig)

      return validatedConfig
    } catch (error) {
      console.error(`配置文件解析失败: ${error}`)
      return null
    }
  }

  /**
   * 查找配置文件
   */
  private async findConfigFile(searchPath: string): Promise<string | null> {
    for (const fileName of CONFIG_FILES) {
      const filePath = path.join(searchPath, fileName)

      if (await fs.pathExists(filePath)) {
        return filePath
      }
    }

    // 向上查找父目录
    const parentDir = path.dirname(searchPath)

    // 已到根目录
    if (parentDir === searchPath) {
      return null
    }

    return this.findConfigFile(parentDir)
  }

  /**
   * 解析配置文件
   */
  private async parseConfigFile(filePath: string): Promise<FullConfig> {
    const ext = path.extname(filePath)

    if (ext === '.json') {
      // JSON 文件
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content)
    }

    // JavaScript/TypeScript 文件
    // 注意：在实际使用中，需要处理 TypeScript 文件的编译
    try {
      // 动态导入模块
      const configModule = await import(filePath)
      return configModule.default || configModule
    } catch (error) {
      throw new Error(`无法加载配置文件 ${filePath}: ${error}`)
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: any): FullConfig {
    const validatedConfig: FullConfig = {}

    // 模板目录
    if (config.templateDir && typeof config.templateDir === 'string') {
      validatedConfig.templateDir = config.templateDir
    }

    // 输出目录
    if (config.outputDir && typeof config.outputDir === 'string') {
      validatedConfig.outputDir = config.outputDir
    }

    // 命名规范
    if (config.nameCase && ['camelCase', 'pascalCase', 'kebabCase', 'snakeCase'].includes(config.nameCase)) {
      validatedConfig.nameCase = config.nameCase
    }

    // 文件结构
    if (config.fileStructure && ['flat', 'nested'].includes(config.fileStructure)) {
      validatedConfig.fileStructure = config.fileStructure
    }

    // 默认语言
    if (config.defaultLang && ['ts', 'js', 'tsx', 'jsx'].includes(config.defaultLang)) {
      validatedConfig.defaultLang = config.defaultLang
    }

    // 样式类型
    if (config.styleType) {
      validatedConfig.styleType = config.styleType
    }

    // 测试框架
    if (config.testFramework) {
      validatedConfig.testFramework = config.testFramework
    }

    // Prettier
    if (typeof config.prettier === 'boolean') {
      validatedConfig.prettier = config.prettier
    }

    // 插件
    if (Array.isArray(config.plugins)) {
      validatedConfig.plugins = config.plugins
    }

    return validatedConfig
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.configCache.clear()
  }

  /**
   * 合并配置
   */
  mergeConfig(baseConfig: FullConfig, userConfig: Partial<FullConfig>): FullConfig {
    return {
      ...baseConfig,
      ...userConfig,
      plugins: [
        ...(baseConfig.plugins || []),
        ...(userConfig.plugins || [])
      ]
    }
  }
}

/**
 * 创建默认配置
 */
export function createDefaultConfig(): FullConfig {
  return {
    nameCase: 'pascalCase',
    fileStructure: 'flat',
    defaultLang: 'ts',
    styleType: 'css',
    testFramework: 'vitest',
    prettier: true
  }
}

/**
 * 全局配置加载器实例
 */
export const configLoader = new ConfigLoader()

/**
 * 加载配置的便捷函数
 */
export async function loadConfig(searchPath?: string): Promise<FullConfig> {
  const config = await configLoader.loadConfig(searchPath)
  return config || createDefaultConfig()
}

export default ConfigLoader


