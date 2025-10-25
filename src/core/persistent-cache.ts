/**
 * 持久化缓存
 * 支持将缓存保存到文件系统
 */

import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { logger } from './logger'

/**
 * 持久化缓存配置
 */
export interface PersistentCacheConfig {
  /**
   * 缓存目录
   */
  cacheDir: string
  
  /**
   * 是否启用持久化
   */
  enabled: boolean
  
  /**
   * 过期时间（毫秒）
   */
  ttl: number
  
  /**
   * 最大缓存大小（MB）
   */
  maxSize: number
  
  /**
   * 自动清理间隔（毫秒）
   */
  cleanupInterval: number
}

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  size: number
}

/**
 * 持久化缓存管理器
 */
export class PersistentCache<T = any> {
  private config: PersistentCacheConfig
  private cache: Map<string, CacheEntry<T>> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null
  private totalSize = 0

  constructor(namespace: string, config?: Partial<PersistentCacheConfig>) {
    this.config = {
      cacheDir: path.join(os.homedir(), '.ldesign', 'cache', namespace),
      enabled: true,
      ttl: 86400000, // 24 hours
      maxSize: 100, // 100MB
      cleanupInterval: 3600000, // 1 hour
      ...config
    }

    if (this.config.enabled) {
      this.initialize()
    }
  }

  /**
   * 初始化
   */
  private async initialize(): Promise<void> {
    try {
      // 确保缓存目录存在
      await fs.ensureDir(this.config.cacheDir)

      // 加载现有缓存
      await this.load()

      // 启动定期清理
      this.startCleanup()

      logger.debug('持久化缓存已初始化', {
        cacheDir: this.config.cacheDir,
        entries: this.cache.size
      })
    } catch (error) {
      logger.error('持久化缓存初始化失败', error as Error)
    }
  }

  /**
   * 获取缓存值
   */
  async get(key: string): Promise<T | null> {
    // 先从内存获取
    const entry = this.cache.get(key)

    if (entry) {
      // 检查是否过期
      if (Date.now() - entry.timestamp > this.config.ttl) {
        await this.delete(key)
        return null
      }

      return entry.value
    }

    // 尝试从文件系统加载
    if (this.config.enabled) {
      return await this.loadFromDisk(key)
    }

    return null
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value)
    const size = Buffer.byteLength(serialized, 'utf-8')

    // 检查缓存大小限制
    if (this.totalSize + size > this.config.maxSize * 1024 * 1024) {
      await this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      size
    }

    this.cache.set(key, entry)
    this.totalSize += size

    // 保存到磁盘
    if (this.config.enabled) {
      await this.saveToDisk(key, entry)
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    this.cache.delete(key)
    this.totalSize -= entry.size

    // 从磁盘删除
    if (this.config.enabled) {
      await this.deleteFromDisk(key)
    }

    return true
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.totalSize = 0

    if (this.config.enabled) {
      try {
        await fs.emptyDir(this.config.cacheDir)
      } catch (error) {
        logger.error('清空缓存目录失败', error as Error)
      }
    }
  }

  /**
   * 从磁盘加载
   */
  private async loadFromDisk(key: string): Promise<T | null> {
    try {
      const filePath = this.getCacheFilePath(key)

      if (!(await fs.pathExists(filePath))) {
        return null
      }

      const content = await fs.readFile(filePath, 'utf-8')
      const entry: CacheEntry<T> = JSON.parse(content)

      // 检查是否过期
      if (Date.now() - entry.timestamp > this.config.ttl) {
        await this.deleteFromDisk(key)
        return null
      }

      // 加载到内存
      this.cache.set(key, entry)
      this.totalSize += entry.size

      return entry.value
    } catch (error) {
      logger.error('从磁盘加载缓存失败', error as Error, { key })
      return null
    }
  }

  /**
   * 保存到磁盘
   */
  private async saveToDisk(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key)
      await fs.ensureDir(path.dirname(filePath))
      await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8')
    } catch (error) {
      logger.error('保存缓存到磁盘失败', error as Error, { key })
    }
  }

  /**
   * 从磁盘删除
   */
  private async deleteFromDisk(key: string): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key)
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath)
      }
    } catch (error) {
      logger.error('从磁盘删除缓存失败', error as Error, { key })
    }
  }

  /**
   * 加载所有缓存
   */
  private async load(): Promise<void> {
    try {
      if (!(await fs.pathExists(this.config.cacheDir))) {
        return
      }

      const files = await fs.readdir(this.config.cacheDir)

      for (const file of files) {
        if (file.endsWith('.cache')) {
          const key = file.replace('.cache', '')
          await this.loadFromDisk(key)
        }
      }
    } catch (error) {
      logger.error('加载缓存失败', error as Error)
    }
  }

  /**
   * 驱逐最旧的缓存
   */
  private async evictOldest(): Promise<void> {
    if (this.cache.size === 0) {
      return
    }

    // 按时间戳排序
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    )

    // 删除最旧的10%
    const toDelete = Math.ceil(entries.length * 0.1)

    for (let i = 0; i < toDelete; i++) {
      await this.delete(entries[i][0])
    }

    logger.debug('驱逐最旧缓存', { count: toDelete })
  }

  /**
   * 清理过期缓存
   */
  private async cleanup(): Promise<void> {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key)
      }
    })

    for (const key of expiredKeys) {
      await this.delete(key)
    }

    if (expiredKeys.length > 0) {
      logger.debug('清理过期缓存', { count: expiredKeys.length })
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      return
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止定期清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 获取缓存文件路径
   */
  private getCacheFilePath(key: string): string {
    // 使用哈希避免文件名过长或包含非法字符
    const hash = this.hashKey(key)
    return path.join(this.config.cacheDir, `${hash}.cache`)
  }

  /**
   * 哈希键名
   */
  private hashKey(key: string): string {
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    entries: number
    totalSize: number
    totalSizeMB: number
    cacheDir: string
    enabled: boolean
  } {
    return {
      entries: this.cache.size,
      totalSize: this.totalSize,
      totalSizeMB: this.totalSize / (1024 * 1024),
      cacheDir: this.config.cacheDir,
      enabled: this.config.enabled
    }
  }

  /**
   * 导出缓存
   */
  async export(outputPath: string): Promise<void> {
    const data = {
      timestamp: new Date().toISOString(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        value: entry.value,
        timestamp: new Date(entry.timestamp).toISOString(),
        size: entry.size
      }))
    }

    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8')
    logger.info('缓存已导出', { outputPath, entries: data.entries.length })
  }

  /**
   * 导入缓存
   */
  async import(inputPath: string): Promise<void> {
    try {
      const content = await fs.readFile(inputPath, 'utf-8')
      const data = JSON.parse(content)

      for (const entry of data.entries) {
        await this.set(entry.key, entry.value)
      }

      logger.info('缓存已导入', { inputPath, entries: data.entries.length })
    } catch (error) {
      logger.error('导入缓存失败', error as Error, { inputPath })
      throw error
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopCleanup()
    this.cache.clear()
    this.totalSize = 0
  }
}

/**
 * 创建持久化缓存
 */
export function createPersistentCache<T>(
  namespace: string,
  config?: Partial<PersistentCacheConfig>
): PersistentCache<T> {
  return new PersistentCache<T>(namespace, config)
}

export default PersistentCache


