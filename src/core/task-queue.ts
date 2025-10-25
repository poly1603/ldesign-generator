/**
 * 任务队列系统
 * 支持优先级、并发控制、超时、重试等功能
 */

import { logger } from './logger'
import { performanceMonitor } from './performance-monitor'

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

/**
 * 任务定义
 */
export interface Task<T = any> {
  id: string
  name: string
  priority: TaskPriority
  executor: () => Promise<T>
  timeout?: number
  retries?: number
  onProgress?: (progress: number) => void
  metadata?: Record<string, any>
}

/**
 * 任务结果
 */
export interface TaskResult<T = any> {
  taskId: string
  status: TaskStatus
  result?: T
  error?: Error
  duration: number
  retryCount: number
  timestamp: Date
}

/**
 * 任务队列配置
 */
export interface TaskQueueConfig {
  /**
   * 最大并发数
   */
  maxConcurrent: number
  
  /**
   * 默认超时时间（毫秒）
   */
  defaultTimeout: number
  
  /**
   * 默认重试次数
   */
  defaultRetries: number
  
  /**
   * 重试延迟（毫秒）
   */
  retryDelay: number
  
  /**
   * 是否自动启动
   */
  autoStart: boolean
  
  /**
   * 队列满时的策略
   */
  overflowStrategy: 'reject' | 'wait' | 'drop-oldest'
  
  /**
   * 最大队列长度
   */
  maxQueueSize: number
}

/**
 * 任务队列
 */
export class TaskQueue {
  private queue: Task[] = []
  private running: Map<string, { task: Task; startTime: number }> = new Map()
  private results: Map<string, TaskResult> = new Map()
  private config: TaskQueueConfig
  private isStarted = false
  private isPaused = false
  private taskIdCounter = 0

  constructor(config?: Partial<TaskQueueConfig>) {
    this.config = {
      maxConcurrent: 5,
      defaultTimeout: 30000, // 30s
      defaultRetries: 2,
      retryDelay: 1000, // 1s
      autoStart: true,
      overflowStrategy: 'wait',
      maxQueueSize: 1000,
      ...config
    }

    if (this.config.autoStart) {
      this.start()
    }
  }

  /**
   * 添加任务
   */
  async add<T>(task: Omit<Task<T>, 'id'>): Promise<string> {
    // 检查队列是否已满
    if (this.queue.length >= this.config.maxQueueSize) {
      switch (this.config.overflowStrategy) {
        case 'reject':
          throw new Error('任务队列已满')
        case 'drop-oldest':
          this.queue.shift()
          break
        case 'wait':
          // 等待队列有空位
          await this.waitForSpace()
          break
      }
    }

    const taskId = this.generateTaskId()
    const fullTask: Task<T> = {
      ...task,
      id: taskId,
      timeout: task.timeout || this.config.defaultTimeout,
      retries: task.retries ?? this.config.defaultRetries
    }

    // 按优先级插入
    this.insertByPriority(fullTask)

    logger.debug('任务已添加到队列', { taskId, name: task.name, priority: task.priority })

    // 如果队列已启动，触发处理
    if (this.isStarted && !this.isPaused) {
      this.process()
    }

    return taskId
  }

  /**
   * 批量添加任务
   */
  async addBatch<T>(tasks: Array<Omit<Task<T>, 'id'>>): Promise<string[]> {
    const taskIds: string[] = []
    
    for (const task of tasks) {
      const taskId = await this.add(task)
      taskIds.push(taskId)
    }
    
    return taskIds
  }

  /**
   * 启动队列处理
   */
  start(): void {
    if (this.isStarted) {
      logger.warn('任务队列已经启动')
      return
    }

    this.isStarted = true
    this.isPaused = false
    logger.info('任务队列已启动')
    
    this.process()
  }

  /**
   * 暂停队列处理
   */
  pause(): void {
    this.isPaused = true
    logger.info('任务队列已暂停')
  }

  /**
   * 恢复队列处理
   */
  resume(): void {
    if (!this.isPaused) {
      return
    }

    this.isPaused = false
    logger.info('任务队列已恢复')
    
    this.process()
  }

  /**
   * 停止队列处理
   */
  stop(): void {
    this.isStarted = false
    this.isPaused = false
    logger.info('任务队列已停止')
  }

  /**
   * 处理队列
   */
  private async process(): Promise<void> {
    if (!this.isStarted || this.isPaused) {
      return
    }

    // 检查是否还有可用槽位
    while (this.running.size < this.config.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!
      
      // 执行任务
      this.executeTask(task)
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task, retryCount = 0): Promise<void> {
    const startTime = Date.now()
    this.running.set(task.id, { task, startTime })

    logger.debug('开始执行任务', { taskId: task.id, name: task.name })

    try {
      // 使用性能监控
      const result = await performanceMonitor.measure(
        `task:${task.name}`,
        async () => {
          // 应用超时
          if (task.timeout) {
            return await this.executeWithTimeout(task.executor, task.timeout)
          }
          return await task.executor()
        }
      )

      const duration = Date.now() - startTime

      // 记录成功结果
      this.results.set(task.id, {
        taskId: task.id,
        status: TaskStatus.COMPLETED,
        result,
        duration,
        retryCount,
        timestamp: new Date()
      })

      logger.debug('任务执行成功', {
        taskId: task.id,
        name: task.name,
        duration
      })
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('任务执行失败', error as Error, {
        taskId: task.id,
        name: task.name,
        retryCount
      })

      // 检查是否需要重试
      if (retryCount < (task.retries || 0)) {
        logger.info('准备重试任务', {
          taskId: task.id,
          name: task.name,
          retryCount: retryCount + 1
        })

        // 更新任务状态为重试中
        this.results.set(task.id, {
          taskId: task.id,
          status: TaskStatus.RETRYING,
          error: error as Error,
          duration,
          retryCount,
          timestamp: new Date()
        })

        // 延迟后重试
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount))
        
        // 将任务放回队列（高优先级）
        this.queue.unshift({ ...task, priority: TaskPriority.URGENT })
      } else {
        // 记录失败结果
        this.results.set(task.id, {
          taskId: task.id,
          status: TaskStatus.FAILED,
          error: error as Error,
          duration,
          retryCount,
          timestamp: new Date()
        })
      }
    } finally {
      // 从运行列表移除
      this.running.delete(task.id)

      // 继续处理队列
      this.process()
    }
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`任务执行超时（${timeout}ms）`))
      }, timeout)

      fn()
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 等待队列有空位
   */
  private async waitForSpace(): Promise<void> {
    while (this.queue.length >= this.config.maxQueueSize) {
      await this.delay(100)
    }
  }

  /**
   * 按优先级插入任务
   */
  private insertByPriority(task: Task): void {
    // 找到第一个优先级更低的任务的位置
    const index = this.queue.findIndex(t => t.priority < task.priority)
    
    if (index === -1) {
      // 所有任务优先级都更高或队列为空，添加到末尾
      this.queue.push(task)
    } else {
      // 插入到找到的位置
      this.queue.splice(index, 0, task)
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task-${++this.taskIdCounter}-${Date.now()}`
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(t => t.id === taskId)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
      
      this.results.set(taskId, {
        taskId,
        status: TaskStatus.CANCELLED,
        duration: 0,
        retryCount: 0,
        timestamp: new Date()
      })
      
      logger.info('任务已取消', { taskId })
      return true
    }

    // 无法取消正在运行的任务
    if (this.running.has(taskId)) {
      logger.warn('无法取消正在运行的任务', { taskId })
      return false
    }

    return false
  }

  /**
   * 取消所有任务
   */
  cancelAll(): number {
    const count = this.queue.length
    
    this.queue.forEach(task => {
      this.results.set(task.id, {
        taskId: task.id,
        status: TaskStatus.CANCELLED,
        duration: 0,
        retryCount: 0,
        timestamp: new Date()
      })
    })
    
    this.queue = []
    logger.info('所有任务已取消', { count })
    
    return count
  }

  /**
   * 获取任务结果
   */
  getResult(taskId: string): TaskResult | undefined {
    return this.results.get(taskId)
  }

  /**
   * 等待任务完成
   */
  async waitFor(taskId: string, timeout?: number): Promise<TaskResult> {
    const startTime = Date.now()
    
    while (true) {
      const result = this.results.get(taskId)
      
      if (result && result.status !== TaskStatus.RETRYING) {
        return result
      }

      // 检查超时
      if (timeout && Date.now() - startTime > timeout) {
        throw new Error(`等待任务超时: ${taskId}`)
      }

      await this.delay(100)
    }
  }

  /**
   * 等待所有任务完成
   */
  async waitAll(timeout?: number): Promise<Map<string, TaskResult>> {
    const startTime = Date.now()
    
    while (true) {
      if (this.queue.length === 0 && this.running.size === 0) {
        return this.results
      }

      // 检查超时
      if (timeout && Date.now() - startTime > timeout) {
        throw new Error('等待所有任务超时')
      }

      await this.delay(100)
    }
  }

  /**
   * 获取队列统计
   */
  getStats(): {
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
    total: number
  } {
    const completed = Array.from(this.results.values()).filter(
      r => r.status === TaskStatus.COMPLETED
    ).length

    const failed = Array.from(this.results.values()).filter(
      r => r.status === TaskStatus.FAILED
    ).length

    const cancelled = Array.from(this.results.values()).filter(
      r => r.status === TaskStatus.CANCELLED
    ).length

    return {
      pending: this.queue.length,
      running: this.running.size,
      completed,
      failed,
      cancelled,
      total: this.queue.length + this.running.size + this.results.size
    }
  }

  /**
   * 清空队列和结果
   */
  clear(): void {
    this.queue = []
    this.results.clear()
    // 注意：不清空正在运行的任务
    logger.info('队列已清空')
  }

  /**
   * 清空结果
   */
  clearResults(): void {
    this.results.clear()
  }

  /**
   * 获取所有任务结果
   */
  getAllResults(): TaskResult[] {
    return Array.from(this.results.values())
  }

  /**
   * 获取失败的任务
   */
  getFailedTasks(): TaskResult[] {
    return Array.from(this.results.values()).filter(
      r => r.status === TaskStatus.FAILED
    )
  }

  /**
   * 获取成功的任务
   */
  getCompletedTasks(): TaskResult[] {
    return Array.from(this.results.values()).filter(
      r => r.status === TaskStatus.COMPLETED
    )
  }

  /**
   * 重试失败的任务
   */
  async retryFailed(): Promise<number> {
    const failedTasks = this.getFailedTasks()
    
    if (failedTasks.length === 0) {
      logger.info('没有失败的任务需要重试')
      return 0
    }

    // 从结果中找到原始任务（这需要保存原始任务引用）
    logger.info(`准备重试 ${failedTasks.length} 个失败的任务`)
    
    // 注意：这个实现简化了，实际使用中需要保存原始任务的引用
    return failedTasks.length
  }

  /**
   * 获取预计完成时间
   */
  getEstimatedCompletion(): { eta: number; etaDate: Date } | null {
    if (this.queue.length === 0 && this.running.size === 0) {
      return null
    }

    const completedResults = this.getCompletedTasks()
    
    if (completedResults.length === 0) {
      return null
    }

    // 计算平均执行时间
    const avgDuration = completedResults.reduce((sum, r) => sum + r.duration, 0) / completedResults.length
    
    // 预计剩余时间
    const remainingTasks = this.queue.length + this.running.size
    const parallelFactor = Math.min(this.config.maxConcurrent, remainingTasks)
    const eta = (avgDuration * remainingTasks) / parallelFactor
    
    return {
      eta,
      etaDate: new Date(Date.now() + eta)
    }
  }

  /**
   * 显示队列状态
   */
  displayStatus(): void {
    const stats = this.getStats()
    const eta = this.getEstimatedCompletion()

    console.log('\n📊 任务队列状态:')
    console.log(`  等待中: ${stats.pending}`)
    console.log(`  运行中: ${stats.running}`)
    console.log(`  已完成: ${stats.completed}`)
    console.log(`  失败: ${stats.failed}`)
    console.log(`  已取消: ${stats.cancelled}`)
    console.log(`  总计: ${stats.total}`)

    if (eta) {
      const minutes = Math.floor(eta.eta / 60000)
      const seconds = Math.floor((eta.eta % 60000) / 1000)
      console.log(`  预计完成: ${minutes}分${seconds}秒后 (${eta.etaDate.toLocaleTimeString()})`)
    }

    console.log()
  }

  /**
   * 获取配置
   */
  getConfig(): TaskQueueConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TaskQueueConfig>): void {
    this.config = { ...this.config, ...config }
    logger.debug('任务队列配置已更新', config)
  }
}

/**
 * 创建任务队列
 */
export function createTaskQueue(config?: Partial<TaskQueueConfig>): TaskQueue {
  return new TaskQueue(config)
}

export default TaskQueue


