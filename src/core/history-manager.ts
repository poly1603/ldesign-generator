import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { logger } from './logger'

/**
 * 历史记录条目
 */
export interface HistoryEntry {
  id: string
  timestamp: Date
  operation: 'generate' | 'batch-generate' | 'delete'
  templateName: string
  files: Array<{
    path: string
    action: 'create' | 'overwrite' | 'delete'
    size: number
    hash?: string
  }>
  metadata: Record<string, any>
  success: boolean
  error?: string
}

/**
 * 查询选项
 */
export interface QueryOptions {
  operation?: 'generate' | 'batch-generate' | 'delete'
  startDate?: Date
  endDate?: Date
  templateName?: string
  success?: boolean
  limit?: number
  offset?: number
}

/**
 * 历史管理器 - 使用 JSON 文件存储（简化版，不依赖 SQLite）
 */
export class HistoryManager {
  private historyFile: string
  private history: HistoryEntry[] = []
  private static instance: HistoryManager

  constructor(historyDir?: string) {
    const dir = historyDir || path.join(os.homedir(), '.ldesign', 'history')
    fs.ensureDirSync(dir)

    this.historyFile = path.join(dir, 'generator-history.json')
    this.loadHistory()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager()
    }
    return HistoryManager.instance
  }

  /**
   * 加载历史记录
   */
  private async loadHistory(): Promise<void> {
    try {
      if (await fs.pathExists(this.historyFile)) {
        const content = await fs.readFile(this.historyFile, 'utf-8')
        const data = JSON.parse(content)

        // 转换日期字符串为 Date 对象
        this.history = data.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
      }
    } catch (error) {
      logger.error('加载历史记录失败', error as Error)
      this.history = []
    }
  }

  /**
   * 保存历史记录
   */
  private async saveHistory(): Promise<void> {
    try {
      await fs.writeFile(
        this.historyFile,
        JSON.stringify(this.history, null, 2),
        'utf-8'
      )
    } catch (error) {
      logger.error('保存历史记录失败', error as Error)
    }
  }

  /**
   * 添加历史记录
   */
  async add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = this.generateId()

    const historyEntry: HistoryEntry = {
      id,
      timestamp: new Date(),
      ...entry
    }

    this.history.push(historyEntry)
    await this.saveHistory()

    logger.debug('添加历史记录', { id, operation: entry.operation })

    return id
  }

  /**
   * 查询历史记录
   */
  query(options?: QueryOptions): HistoryEntry[] {
    let results = [...this.history]

    // 按操作类型过滤
    if (options?.operation) {
      results = results.filter(e => e.operation === options.operation)
    }

    // 按日期范围过滤
    if (options?.startDate) {
      results = results.filter(e => e.timestamp >= options.startDate!)
    }

    if (options?.endDate) {
      results = results.filter(e => e.timestamp <= options.endDate!)
    }

    // 按模板名称过滤
    if (options?.templateName) {
      results = results.filter(e => e.templateName.includes(options.templateName!))
    }

    // 按成功状态过滤
    if (options?.success !== undefined) {
      results = results.filter(e => e.success === options.success)
    }

    // 排序（最新的在前）
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // 分页
    const offset = options?.offset || 0
    const limit = options?.limit || results.length

    return results.slice(offset, offset + limit)
  }

  /**
   * 获取最近的历史记录
   */
  getRecent(count: number = 10): HistoryEntry[] {
    return this.query({ limit: count })
  }

  /**
   * 根据 ID 获取历史记录
   */
  getById(id: string): HistoryEntry | undefined {
    return this.history.find(e => e.id === id)
  }

  /**
   * 删除历史记录
   */
  async delete(id: string): Promise<boolean> {
    const index = this.history.findIndex(e => e.id === id)

    if (index === -1) {
      return false
    }

    this.history.splice(index, 1)
    await this.saveHistory()

    logger.debug('删除历史记录', { id })

    return true
  }

  /**
   * 清空所有历史记录
   */
  async clear(): Promise<void> {
    this.history = []
    await this.saveHistory()
    logger.info('清空历史记录')
  }

  /**
   * 清空旧历史记录
   */
  async clearOld(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const initialCount = this.history.length
    this.history = this.history.filter(e => e.timestamp >= cutoffDate)

    const removedCount = initialCount - this.history.length

    if (removedCount > 0) {
      await this.saveHistory()
      logger.info(`清理了 ${removedCount} 条历史记录（保留 ${daysToKeep} 天内的记录）`)
    }

    return removedCount
  }

  /**
   * 导出历史记录
   */
  async export(outputPath: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(this.history, null, 2), 'utf-8')
    } else {
      // CSV format
      const lines: string[] = []

      // 标题行
      lines.push('ID,时间,操作,模板,文件数,成功,错误')

      // 数据行
      this.history.forEach(entry => {
        lines.push([
          entry.id,
          entry.timestamp.toISOString(),
          entry.operation,
          entry.templateName,
          entry.files.length,
          entry.success,
          entry.error || ''
        ].join(','))
      })

      await fs.writeFile(outputPath, lines.join('\n'), 'utf-8')
    }

    logger.info(`历史记录已导出: ${outputPath}`)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const total = this.history.length
    const successful = this.history.filter(e => e.success).length
    const failed = total - successful

    const operations = {
      generate: this.history.filter(e => e.operation === 'generate').length,
      batchGenerate: this.history.filter(e => e.operation === 'batch-generate').length,
      delete: this.history.filter(e => e.operation === 'delete').length
    }

    const totalFiles = this.history.reduce((sum, e) => sum + e.files.length, 0)

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%',
      operations,
      totalFiles
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 计算文件哈希（简化版）
   */
  private async calculateHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')

      // 简单的哈希函数
      let hash = 0
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }

      return hash.toString(36)
    } catch {
      return ''
    }
  }
}

/**
 * 全局历史管理器实例
 */
export const historyManager = HistoryManager.getInstance()

export default historyManager


