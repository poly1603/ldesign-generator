export interface GeneratorOptions {
  templateDir: string
  outputDir: string
  plugins?: Plugin[]
  config?: GeneratorConfig
}

export interface GeneratorConfig {
  nameCase?: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase'
  fileStructure?: 'flat' | 'nested'
  defaultLang?: 'ts' | 'js' | 'tsx' | 'jsx'
  styleType?: 'css' | 'scss' | 'less' | 'stylus' | 'none'
  testFramework?: 'vitest' | 'jest' | 'none'
  prettier?: boolean
}

export interface GenerateResult {
  success: boolean
  outputPath?: string
  error?: string
  message: string
  metadata?: Record<string, any>
}

export interface ComponentOptions {
  name: string
  props?: Array<{ name: string; type: string; default?: any; required?: boolean }>
  emits?: string[]
  withScript?: boolean
  withStyle?: boolean
  withTypes?: boolean
  withTest?: boolean
  lang?: 'ts' | 'js' | 'tsx' | 'jsx'
  styleType?: 'css' | 'scss' | 'less' | 'stylus'
  description?: string
}

export interface PageOptions extends ComponentOptions {
  route?: string
  layout?: string
  withStore?: boolean
  withApi?: boolean
  crudType?: 'list' | 'detail' | 'edit' | 'create' | 'none'
}

export interface HookOptions {
  name: string
  type: 'vue' | 'react'
  params?: Array<{ name: string; type: string }>
  returns?: string
  async?: boolean
  withTest?: boolean
  description?: string
}

export interface StoreOptions {
  name: string
  type: 'pinia' | 'vuex' | 'redux' | 'zustand'
  state?: Array<{ name: string; type: string; default?: any }>
  actions?: string[]
  withTypes?: boolean
  withPersist?: boolean
  description?: string
}

export interface ApiOptions {
  name: string
  baseUrl?: string
  endpoints?: Array<{
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    path: string
    params?: string[]
    body?: string
    response?: string
  }>
  withTypes?: boolean
  withMock?: boolean
  description?: string
}

export interface TemplateData {
  [key: string]: unknown
}

/**
 * 命名风格类型
 */
export type NamingStyle = 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase' | 'constantCase'

/**
 * 模板引擎类型
 */
export type TemplateEngineType = 'ejs' | 'handlebars'

/**
 * 框架类型
 */
export type FrameworkType = 'vue' | 'react' | 'angular' | 'svelte' | 'common'

/**
 * 语言类型
 */
export type LanguageType = 'ts' | 'js' | 'tsx' | 'jsx'

/**
 * 样式类型
 */
export type StyleType = 'css' | 'scss' | 'less' | 'stylus' | 'none' | 'tailwind' | 'css-modules'

/**
 * 测试框架类型
 */
export type TestFrameworkType = 'vitest' | 'jest' | 'none'

export interface TemplateMetadata {
  name: string
  type: 'component' | 'page' | 'hook' | 'store' | 'api' | 'util' | 'custom'
  framework?: 'vue' | 'react' | 'common'
  description?: string
  author?: string
  version?: string
}

// 插件系统相关类型
export interface Plugin {
  name: string
  version: string
  description?: string
  hooks?: PluginHooks
  config?: Record<string, any>
}

export interface PluginHooks {
  beforeGenerate?: (context: PluginContext) => Promise<void> | void
  afterGenerate?: (context: PluginContext, result: GenerateResult) => Promise<void> | void
  onError?: (context: PluginContext, error: Error) => Promise<void> | void
  onTemplateRender?: (context: PluginContext, content: string) => Promise<string> | string
}

export interface PluginContext {
  generator: Generator
  options: ComponentOptions | PageOptions | HookOptions | StoreOptions | ApiOptions
  templateName: string
  data: TemplateData
  outputDir: string
  config?: GeneratorConfig
}

/**
 * 前向声明 Generator 类型
 */
export interface Generator {
  getTemplateEngine(): TemplateEngine
  getPluginManager(): PluginManager
  generate(templateName: string, data: Record<string, any>): Promise<GenerateResult>
  generateBatch(items: Array<{ template: string; data: Record<string, any> }>): Promise<GenerateResult[]>
}

/**
 * 前向声明 TemplateEngine 类型
 */
export interface TemplateEngine {
  render(templateName: string, data: Record<string, any>): Promise<string>
  registerTemplate(name: string, content: string, metadata?: TemplateMetadata): void
  registerHelper(name: string, fn: any): void
}

/**
 * 前向声明 PluginManager 类型
 */
export interface PluginManager {
  register(plugin: Plugin): void
  registerBatch(plugins: Plugin[]): void
  load(pluginName: string): void
  loadAll(): void
  getPlugin(pluginName: string): Plugin | undefined
  getLoadedPlugins(): Plugin[]
}

// 导出错误类型
export * from './errors'

// 导出国际化类型
export * from './i18n'

