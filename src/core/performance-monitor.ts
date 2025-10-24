import chalk from 'chalk'
import os from 'os'

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  operationName: string
  startTime: number
  endTime?: number
  duration?: number
  memoryUsage?: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  metadata?: Record<string, any>
}

/**
 * 性能统计
 */
export interface PerformanceStats {
  totalOperations: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  operations: PerformanceMetrics[]
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private completedMetrics: PerformanceMetrics[] = []
  private enabled: boolean = true
  private static instance: PerformanceMonitor

  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 开始监控操作
   */
  start(operationName: string, metadata?: Record<string, any>): string {
    if (!this.enabled) return operationName

    const metric: PerformanceMetrics = {
      operationName,
      startTime: Date.now(),
      memoryUsage: this.getMemoryUsage(),
      metadata
    }

    this.metrics.set(operationName, metric)

    return operationName
  }

  /**
   * 结束监控操作
   */
  end(operationName: string): number | null {
    if (!this.enabled) return null

    const metric = this.metrics.get(operationName)

    if (!metric) {
      console.warn(`⚠️  性能监控: 未找到操作 "${operationName}"`)
      return null
    }

    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime

    // 记录结束时的内存使用
    const endMemory = this.getMemoryUsage()
    if (metric.memoryUsage) {
      metric.memoryUsage = {
        heapUsed: endMemory.heapUsed - metric.memoryUsage.heapUsed,
        heapTotal: endMemory.heapTotal - metric.memoryUsage.heapTotal,
        external: endMemory.external - metric.memoryUsage.external,
        rss: endMemory.rss - metric.memoryUsage.rss
      }
    }

    this.completedMetrics.push(metric)
    this.metrics.delete(operationName)

    return metric.duration
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(
    operationName: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return await fn()
    }

    this.start(operationName, metadata)

    try {
      const result = await fn()
      const duration = this.end(operationName)

      if (duration !== null && duration > 1000) {
        console.log(chalk.yellow(`⏱️  ${operationName} 耗时 ${duration}ms`))
      }

      return result
    } catch (error) {
      this.end(operationName)
      throw error
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number; rss: number } {
    const usage = process.memoryUsage()

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): PerformanceStats {
    const durations = this.completedMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!)

    if (durations.length === 0) {
      return {
        totalOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        operations: []
      }
    }

    const totalDuration = durations.reduce((sum, d) => sum + d, 0)

    return {
      totalOperations: this.completedMetrics.length,
      totalDuration,
      averageDuration: totalDuration / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      operations: this.completedMetrics
    }
  }

  /**
   * 获取慢操作（超过阈值）
   */
  getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return this.completedMetrics.filter(m =>
      m.duration !== undefined && m.duration > threshold
    )
  }

  /**
   * 生成性能报告
   */
  generateReport(options?: {
    format?: 'text' | 'json' | 'table'
    showMemory?: boolean
    sortBy?: 'name' | 'duration' | 'memory'
  }): string {
    const format = options?.format || 'text'
    const showMemory = options?.showMemory ?? false
    const sortBy = options?.sortBy || 'duration'

    const stats = this.getStats()

    if (format === 'json') {
      return JSON.stringify(stats, null, 2)
    }

    if (format === 'table') {
      return this.generateTableReport(stats, showMemory)
    }

    // Text format
    return this.generateTextReport(stats, showMemory)
  }

  /**
   * 生成文本报告
   */
  private generateTextReport(stats: PerformanceStats, showMemory: boolean): string {
    const lines: string[] = []

    lines.push(chalk.bold.cyan('\n📊 性能报告'))
    lines.push(chalk.gray('═'.repeat(80)))

    // 总体统计
    lines.push(chalk.bold('\n总体统计:'))
    lines.push(`  总操作数: ${chalk.cyan(stats.totalOperations)}`)
    lines.push(`  总耗时: ${chalk.cyan(formatDuration(stats.totalDuration))}`)
    lines.push(`  平均耗时: ${chalk.cyan(formatDuration(stats.averageDuration))}`)
    lines.push(`  最快操作: ${chalk.green(formatDuration(stats.minDuration))}`)
    lines.push(`  最慢操作: ${chalk.red(formatDuration(stats.maxDuration))}`)

    // 系统信息
    lines.push(chalk.bold('\n系统信息:'))
    lines.push(`  CPU: ${os.cpus()[0].model}`)
    lines.push(`  核心数: ${os.cpus().length}`)
    lines.push(`  总内存: ${formatBytes(os.totalmem())}`)
    lines.push(`  空闲内存: ${formatBytes(os.freemem())}`)
    lines.push(`  Node版本: ${process.version}`)

    // 操作详情
    if (stats.operations.length > 0) {
      lines.push(chalk.bold('\n操作详情:'))

      const sorted = [...stats.operations].sort((a, b) =>
        (b.duration || 0) - (a.duration || 0)
      )

      sorted.slice(0, 10).forEach((metric, index) => {
        const duration = formatDuration(metric.duration || 0)
        const bar = this.createProgressBar(metric.duration || 0, stats.maxDuration, 20)

        lines.push(`  ${index + 1}. ${metric.operationName}`)
        lines.push(`     ${bar} ${chalk.cyan(duration)}`)

        if (showMemory && metric.memoryUsage) {
          lines.push(`     内存: ${formatBytes(metric.memoryUsage.heapUsed)}`)
        }
      })

      if (sorted.length > 10) {
        lines.push(chalk.gray(`  ... 还有 ${sorted.length - 10} 个操作`))
      }
    }

    // 慢操作警告
    const slowOps = this.getSlowOperations()
    if (slowOps.length > 0) {
      lines.push(chalk.bold.yellow('\n⚠️  慢操作警告 (>1000ms):'))
      slowOps.forEach((metric, index) => {
        lines.push(`  ${index + 1}. ${metric.operationName}: ${formatDuration(metric.duration || 0)}`)
      })
    }

    lines.push(chalk.gray('\n' + '═'.repeat(80)))

    return lines.join('\n')
  }

  /**
   * 生成表格报告
   */
  private generateTableReport(stats: PerformanceStats, showMemory: boolean): string {
    const lines: string[] = []

    lines.push(chalk.bold.cyan('\n📊 性能报告（表格格式）'))
    lines.push(chalk.gray('═'.repeat(80)))

    // 表头
    const headers = ['序号', '操作名称', '耗时', '进度']
    if (showMemory) {
      headers.push('内存')
    }

    lines.push('\n' + headers.map(h => chalk.bold(h.padEnd(20))).join(''))
    lines.push(chalk.gray('─'.repeat(80)))

    // 数据行
    stats.operations.forEach((metric, index) => {
      const row = [
        String(index + 1).padEnd(20),
        metric.operationName.slice(0, 18).padEnd(20),
        formatDuration(metric.duration || 0).padEnd(20),
        this.createProgressBar(metric.duration || 0, stats.maxDuration, 15)
      ]

      if (showMemory && metric.memoryUsage) {
        row.push(formatBytes(metric.memoryUsage.heapUsed))
      }

      lines.push(row.join(''))
    })

    lines.push(chalk.gray('═'.repeat(80)) + '\n')

    return lines.join('\n')
  }

  /**
   * 创建进度条
   */
  private createProgressBar(value: number, max: number, width: number = 20): string {
    const percentage = max > 0 ? value / max : 0
    const filled = Math.round(percentage * width)
    const empty = width - filled

    const bar = '█'.repeat(filled) + '░'.repeat(empty)

    if (percentage > 0.8) {
      return chalk.red(bar)
    } else if (percentage > 0.5) {
      return chalk.yellow(bar)
    } else {
      return chalk.green(bar)
    }
  }

  /**
   * 清空所有指标
   */
  clear(): void {
    this.metrics.clear()
    this.completedMetrics = []
  }

  /**
   * 导出性能数据
   */
  export(filePath?: string): string {
    const stats = this.getStats()
    const json = JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      }
    }, null, 2)

    if (filePath) {
      const fs = require('fs-extra')
      fs.writeFileSync(filePath, json, 'utf-8')
      console.log(chalk.green(`✓ 性能报告已导出: ${filePath}`))
    }

    return json
  }

  /**
   * 监控内存使用
   */
  monitorMemory(): {
    used: number
    total: number
    percentage: number
    recommendation: string
  } {
    const usage = process.memoryUsage()
    const heapUsed = usage.heapUsed
    const heapTotal = usage.heapTotal
    const percentage = (heapUsed / heapTotal) * 100

    let recommendation = '内存使用正常'

    if (percentage > 90) {
      recommendation = '⚠️  内存使用过高，建议清理缓存或重启进程'
    } else if (percentage > 70) {
      recommendation = '⚠️  内存使用较高，建议关注'
    }

    return {
      used: heapUsed,
      total: heapTotal,
      percentage,
      recommendation
    }
  }

  /**
   * 获取实时性能数据
   */
  getRealTimeStats(): {
    cpu: number
    memory: ReturnType<typeof this.monitorMemory>
    activeOperations: number
  } {
    // 注意: CPU使用率需要一段时间来计算，这里简化处理
    const cpuUsage = process.cpuUsage()
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 // 转换为秒

    return {
      cpu: cpuPercent,
      memory: this.monitorMemory(),
      activeOperations: this.metrics.size
    }
  }

  /**
   * 显示实时监控
   */
  displayRealTime(interval: number = 5000): NodeJS.Timeout {
    return setInterval(() => {
      const stats = this.getRealTimeStats()

      console.clear()
      console.log(chalk.bold.cyan('📊 性能监控（实时）'))
      console.log(chalk.gray('═'.repeat(80)))
      console.log(chalk.bold('\n当前状态:'))
      console.log(`  活跃操作: ${chalk.cyan(stats.activeOperations)}`)
      console.log(`  内存使用: ${chalk.cyan(formatBytes(stats.memory.used))} / ${formatBytes(stats.memory.total)} (${stats.memory.percentage.toFixed(2)}%)`)
      console.log(`  ${stats.memory.recommendation}`)

      const overallStats = this.getStats()
      if (overallStats.totalOperations > 0) {
        console.log(chalk.bold('\n整体统计:'))
        console.log(`  完成操作: ${chalk.cyan(overallStats.totalOperations)}`)
        console.log(`  平均耗时: ${chalk.cyan(formatDuration(overallStats.averageDuration))}`)
      }

      console.log(chalk.gray('\n按 Ctrl+C 退出监控'))
    }, interval)
  }

  /**
   * 分析瓶颈
   */
  analyzeBottlenecks(threshold: number = 500): {
    slowOperations: PerformanceMetrics[]
    recommendations: string[]
  } {
    const slowOps = this.getSlowOperations(threshold)
    const recommendations: string[] = []

    if (slowOps.length > 0) {
      recommendations.push(`发现 ${slowOps.length} 个慢操作（>${threshold}ms）`)

      // 按操作类型分组
      const grouped = new Map<string, number>()
      slowOps.forEach(op => {
        const type = op.operationName.split(':')[0]
        grouped.set(type, (grouped.get(type) || 0) + 1)
      })

      grouped.forEach((count, type) => {
        if (count >= 3) {
          recommendations.push(`${type} 操作频繁较慢，建议优化或启用缓存`)
        }
      })
    }

    const memory = this.monitorMemory()
    if (memory.percentage > 70) {
      recommendations.push('内存使用较高，建议清理缓存或减少并发操作')
    }

    if (recommendations.length === 0) {
      recommendations.push('✓ 未发现明显性能瓶颈')
    }

    return {
      slowOperations: slowOps,
      recommendations
    }
  }

  /**
   * 获取慢操作
   */
  private getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return this.completedMetrics.filter(m =>
      m.duration !== undefined && m.duration > threshold
    ).sort((a, b) => (b.duration || 0) - (a.duration || 0))
  }

  /**
   * 比较两次运行的性能
   */
  compare(previous: PerformanceStats, current: PerformanceStats): {
    improvement: number
    regression: number
    unchanged: number
    details: string[]
  } {
    const details: string[] = []

    const improvementPercent = current.averageDuration < previous.averageDuration
      ? ((previous.averageDuration - current.averageDuration) / previous.averageDuration * 100)
      : 0

    const regressionPercent = current.averageDuration > previous.averageDuration
      ? ((current.averageDuration - previous.averageDuration) / previous.averageDuration * 100)
      : 0

    if (improvementPercent > 5) {
      details.push(`✓ 性能提升 ${improvementPercent.toFixed(2)}%`)
    } else if (regressionPercent > 5) {
      details.push(`⚠️  性能下降 ${regressionPercent.toFixed(2)}%`)
    } else {
      details.push('性能基本持平')
    }

    details.push(`平均耗时: ${formatDuration(previous.averageDuration)} → ${formatDuration(current.averageDuration)}`)

    return {
      improvement: improvementPercent,
      regression: regressionPercent,
      unchanged: Math.abs(improvementPercent - regressionPercent) < 5 ? 1 : 0,
      details
    }
  }

  /**
   * 重置所有数据
   */
  reset(): void {
    this.metrics.clear()
    this.completedMetrics = []
  }
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  } else {
    return `${(ms / 60000).toFixed(2)}min`
  }
}

/**
 * 格式化字节
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}

/**
 * 全局性能监控实例
 */
export const performanceMonitor = PerformanceMonitor.getInstance()

/**
 * 装饰器：自动监控函数性能
 */
export function monitored(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const name = operationName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return await performanceMonitor.measure(
        name,
        () => originalMethod.apply(this, args)
      )
    }

    return descriptor
  }
}

export default performanceMonitor


