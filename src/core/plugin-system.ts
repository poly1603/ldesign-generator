import type { Plugin, PluginContext, GenerateResult, PluginHooks } from '../types'

/**
 * 插件管理器 - 管理所有插件的注册、加载和生命周期
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private loadedPlugins: Set<string> = new Set()

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 "${plugin.name}" 已经注册`)
    }

    this.plugins.set(plugin.name, plugin)
    console.log(`✓ 插件 "${plugin.name}" (v${plugin.version}) 已注册`)
  }

  /**
   * 批量注册插件
   */
  registerBatch(plugins: Plugin[]): void {
    for (const plugin of plugins) {
      this.register(plugin)
    }
  }

  /**
   * 加载插件
   */
  load(pluginName: string): void {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`插件 "${pluginName}" 未注册`)
    }

    if (this.loadedPlugins.has(pluginName)) {
      console.warn(`插件 "${pluginName}" 已经加载`)
      return
    }

    this.loadedPlugins.add(pluginName)
    console.log(`✓ 插件 "${pluginName}" 已加载`)
  }

  /**
   * 加载所有插件
   */
  loadAll(): void {
    for (const pluginName of this.plugins.keys()) {
      this.load(pluginName)
    }
  }

  /**
   * 卸载插件
   */
  unload(pluginName: string): void {
    if (!this.loadedPlugins.has(pluginName)) {
      console.warn(`插件 "${pluginName}" 未加载`)
      return
    }

    this.loadedPlugins.delete(pluginName)
    console.log(`✓ 插件 "${pluginName}" 已卸载`)
  }

  /**
   * 获取插件
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * 获取所有已加载的插件
   */
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins)
      .map(name => this.plugins.get(name))
      .filter((plugin): plugin is Plugin => plugin !== undefined)
  }

  /**
   * 执行生成前钩子
   */
  async executeBeforeGenerate(context: PluginContext): Promise<void> {
    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.hooks?.beforeGenerate) {
        try {
          await plugin.hooks.beforeGenerate(context)
        } catch (error) {
          console.error(`插件 "${plugin.name}" beforeGenerate 钩子执行失败:`, error)
          throw error
        }
      }
    }
  }

  /**
   * 执行生成后钩子
   */
  async executeAfterGenerate(context: PluginContext, result: GenerateResult): Promise<void> {
    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.hooks?.afterGenerate) {
        try {
          await plugin.hooks.afterGenerate(context, result)
        } catch (error) {
          console.error(`插件 "${plugin.name}" afterGenerate 钩子执行失败:`, error)
          // 不抛出错误，允许其他插件继续执行
        }
      }
    }
  }

  /**
   * 执行错误钩子
   */
  async executeOnError(context: PluginContext, error: Error): Promise<void> {
    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.hooks?.onError) {
        try {
          await plugin.hooks.onError(context, error)
        } catch (hookError) {
          console.error(`插件 "${plugin.name}" onError 钩子执行失败:`, hookError)
        }
      }
    }
  }

  /**
   * 执行模板渲染钩子
   */
  async executeOnTemplateRender(context: PluginContext, content: string): Promise<string> {
    let result = content

    for (const plugin of this.getLoadedPlugins()) {
      if (plugin.hooks?.onTemplateRender) {
        try {
          result = await plugin.hooks.onTemplateRender(context, result)
        } catch (error) {
          console.error(`插件 "${plugin.name}" onTemplateRender 钩子执行失败:`, error)
          throw error
        }
      }
    }

    return result
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear()
    this.loadedPlugins.clear()
  }

  /**
   * 获取插件统计信息
   */
  getStats() {
    return {
      total: this.plugins.size,
      loaded: this.loadedPlugins.size,
      plugins: Array.from(this.plugins.values()).map(p => ({
        name: p.name,
        version: p.version,
        loaded: this.loadedPlugins.has(p.name)
      }))
    }
  }
}

/**
 * 创建插件的辅助函数
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin
}


