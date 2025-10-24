/**
 * LRU 缓存节点
 */
class CacheNode<T> {
  key: string
  value: T
  prev: CacheNode<T> | null = null
  next: CacheNode<T> | null = null
  timestamp: number

  constructor(key: string, value: T) {
    this.key = key
    this.value = value
    this.timestamp = Date.now()
  }
}

/**
 * LRU 缓存实现
 */
class LRUCache<T> {
  private capacity: number
  private cache: Map<string, CacheNode<T>>
  private head: CacheNode<T> | null = null
  private tail: CacheNode<T> | null = null
  private ttl: number // 过期时间（毫秒）

  constructor(capacity: number = 100, ttl: number = 3600000) {
    this.capacity = capacity
    this.cache = new Map()
    this.ttl = ttl
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | null {
    const node = this.cache.get(key)

    if (!node) {
      return null
    }

    // 检查是否过期
    if (Date.now() - node.timestamp > this.ttl) {
      this.delete(key)
      return null
    }

    // 移动到头部（最近使用）
    this.moveToHead(node)

    return node.value
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T): void {
    let node = this.cache.get(key)

    if (node) {
      // 更新已存在的节点
      node.value = value
      node.timestamp = Date.now()
      this.moveToHead(node)
    } else {
      // 创建新节点
      node = new CacheNode(key, value)
      this.cache.set(key, node)
      this.addToHead(node)

      // 检查容量
      if (this.cache.size > this.capacity) {
        this.removeTail()
      }
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const node = this.cache.get(key)

    if (!node) {
      return false
    }

    this.removeNode(node)
    this.cache.delete(key)

    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.head = null
    this.tail = null
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    const node = this.cache.get(key)

    if (!node) {
      return false
    }

    // 检查是否过期
    if (Date.now() - node.timestamp > this.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    // 清理过期的键
    this.cleanExpired()
    return Array.from(this.cache.keys())
  }

  /**
   * 清理过期条目
   */
  private cleanExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((node, key) => {
      if (now - node.timestamp > this.ttl) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => this.delete(key))
  }

  /**
   * 添加节点到头部
   */
  private addToHead(node: CacheNode<T>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  /**
   * 移除节点
   */
  private removeNode(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  /**
   * 移动节点到头部
   */
  private moveToHead(node: CacheNode<T>): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * 移除尾部节点
   */
  private removeTail(): void {
    if (!this.tail) return

    const key = this.tail.key
    this.removeNode(this.tail)
    this.cache.delete(key)
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    this.cleanExpired()

    return {
      size: this.cache.size,
      capacity: this.capacity,
      usage: (this.cache.size / this.capacity * 100).toFixed(2) + '%'
    }
  }
}

/**
 * 缓存管理器配置
 */
export interface CacheManagerConfig {
  templateCacheSize: number
  templateCacheTTL: number
  compiledTemplateCacheSize: number
  compiledTemplateCacheTTL: number
  pluginCacheSize: number
  pluginCacheTTL: number
  enabled: boolean
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private config: CacheManagerConfig
  private templateCache: LRUCache<string>
  private compiledTemplateCache: LRUCache<Function>
  private pluginCache: LRUCache<any>
  private hitCount: number = 0
  private missCount: number = 0
  private static instance: CacheManager

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = {
      templateCacheSize: 100,
      templateCacheTTL: 3600000, // 1 hour
      compiledTemplateCacheSize: 50,
      compiledTemplateCacheTTL: 3600000,
      pluginCacheSize: 20,
      pluginCacheTTL: 7200000, // 2 hours
      enabled: true,
      ...config
    }

    this.templateCache = new LRUCache<string>(
      this.config.templateCacheSize,
      this.config.templateCacheTTL
    )

    this.compiledTemplateCache = new LRUCache<Function>(
      this.config.compiledTemplateCacheSize,
      this.config.compiledTemplateCacheTTL
    )

    this.pluginCache = new LRUCache<any>(
      this.config.pluginCacheSize,
      this.config.pluginCacheTTL
    )
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<CacheManagerConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config)
    }
    return CacheManager.instance
  }

  /**
   * 获取模板内容缓存
   */
  getTemplate(key: string): string | null {
    if (!this.config.enabled) return null

    const value = this.templateCache.get(key)

    if (value) {
      this.hitCount++
    } else {
      this.missCount++
    }

    return value
  }

  /**
   * 设置模板内容缓存
   */
  setTemplate(key: string, content: string): void {
    if (!this.config.enabled) return

    this.templateCache.set(key, content)
  }

  /**
   * 获取编译后的模板缓存
   */
  getCompiledTemplate(key: string): Function | null {
    if (!this.config.enabled) return null

    const value = this.compiledTemplateCache.get(key)

    if (value) {
      this.hitCount++
    } else {
      this.missCount++
    }

    return value
  }

  /**
   * 设置编译后的模板缓存
   */
  setCompiledTemplate(key: string, template: Function): void {
    if (!this.config.enabled) return

    this.compiledTemplateCache.set(key, template)
  }

  /**
   * 获取插件缓存
   */
  getPlugin(key: string): any | null {
    if (!this.config.enabled) return null

    const value = this.pluginCache.get(key)

    if (value) {
      this.hitCount++
    } else {
      this.missCount++
    }

    return value
  }

  /**
   * 设置插件缓存
   */
  setPlugin(key: string, plugin: any): void {
    if (!this.config.enabled) return

    this.pluginCache.set(key, plugin)
  }

  /**
   * 使缓存失效
   */
  invalidate(type: 'template' | 'compiled' | 'plugin' | 'all', key?: string): void {
    if (key) {
      // 失效特定键
      switch (type) {
        case 'template':
          this.templateCache.delete(key)
          break
        case 'compiled':
          this.compiledTemplateCache.delete(key)
          break
        case 'plugin':
          this.pluginCache.delete(key)
          break
        case 'all':
          this.templateCache.delete(key)
          this.compiledTemplateCache.delete(key)
          this.pluginCache.delete(key)
          break
      }
    } else {
      // 清空整个类型的缓存
      switch (type) {
        case 'template':
          this.templateCache.clear()
          break
        case 'compiled':
          this.compiledTemplateCache.clear()
          break
        case 'plugin':
          this.pluginCache.clear()
          break
        case 'all':
          this.clearAll()
          break
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    this.templateCache.clear()
    this.compiledTemplateCache.clear()
    this.pluginCache.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  /**
   * 启用/禁用缓存
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled

    if (!enabled) {
      this.clearAll()
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0
      ? ((this.hitCount / totalRequests) * 100).toFixed(2) + '%'
      : '0%'

    return {
      enabled: this.config.enabled,
      templateCache: this.templateCache.getStats(),
      compiledTemplateCache: this.compiledTemplateCache.getStats(),
      pluginCache: this.pluginCache.getStats(),
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalRequests,
      hitRate
    }
  }

  /**
   * 预热缓存
   */
  async warmup(templates: Array<{ key: string; content: string }>): Promise<void> {
    for (const { key, content } of templates) {
      this.setTemplate(key, content)
    }
  }
}

/**
 * 默认缓存管理器实例
 */
export const cacheManager = CacheManager.getInstance()

/**
 * 创建缓存管理器
 */
export function createCacheManager(config?: Partial<CacheManagerConfig>): CacheManager {
  return new CacheManager(config)
}

export default cacheManager


