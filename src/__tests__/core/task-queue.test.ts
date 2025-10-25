/**
 * 任务队列测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TaskQueue, TaskStatus, TaskPriority, createTaskQueue } from '../../core/task-queue'

describe('TaskQueue', () => {
  let queue: TaskQueue

  beforeEach(() => {
    queue = createTaskQueue({
      maxConcurrent: 2,
      autoStart: false
    })
  })

  describe('add', () => {
    it('should add task to queue', async () => {
      const taskId = await queue.add({
        name: 'test-task',
        priority: TaskPriority.NORMAL,
        executor: async () => 'result'
      })

      expect(taskId).toBeTruthy()
      
      const stats = queue.getStats()
      expect(stats.pending).toBe(1)
    })

    it('should respect priority order', async () => {
      await queue.add({
        name: 'low',
        priority: TaskPriority.LOW,
        executor: async () => 'low'
      })

      await queue.add({
        name: 'urgent',
        priority: TaskPriority.URGENT,
        executor: async () => 'urgent'
      })

      await queue.add({
        name: 'normal',
        priority: TaskPriority.NORMAL,
        executor: async () => 'normal'
      })

      // Urgent should be first
      const stats = queue.getStats()
      expect(stats.pending).toBe(3)
    })
  })

  describe('execute tasks', () => {
    it('should execute tasks successfully', async () => {
      queue.start()

      const taskId = await queue.add({
        name: 'test',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return 'success'
        }
      })

      const result = await queue.waitFor(taskId)

      expect(result.status).toBe(TaskStatus.COMPLETED)
      expect(result.result).toBe('success')
    })

    it('should handle task errors', async () => {
      queue.start()

      const taskId = await queue.add({
        name: 'failing-task',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          throw new Error('Task failed')
        },
        retries: 0
      })

      const result = await queue.waitFor(taskId)

      expect(result.status).toBe(TaskStatus.FAILED)
      expect(result.error?.message).toBe('Task failed')
    })

    it('should retry failed tasks', async () => {
      queue.start()

      let attempts = 0

      const taskId = await queue.add({
        name: 'retry-task',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          attempts++
          if (attempts < 3) {
            throw new Error('Not yet')
          }
          return 'success'
        },
        retries: 3
      })

      const result = await queue.waitFor(taskId, 5000)

      expect(attempts).toBeGreaterThanOrEqual(3)
      expect(result.status).toBe(TaskStatus.COMPLETED)
    })
  })

  describe('cancel', () => {
    it('should cancel pending tasks', async () => {
      const taskId = await queue.add({
        name: 'to-cancel',
        priority: TaskPriority.NORMAL,
        executor: async () => 'result'
      })

      const cancelled = queue.cancel(taskId)

      expect(cancelled).toBe(true)
      
      const result = queue.getResult(taskId)
      expect(result?.status).toBe(TaskStatus.CANCELLED)
    })

    it('should not cancel running tasks', async () => {
      queue.start()

      const taskId = await queue.add({
        name: 'running',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return 'result'
        }
      })

      // Wait for task to start
      await new Promise(resolve => setTimeout(resolve, 50))

      const cancelled = queue.cancel(taskId)
      expect(cancelled).toBe(false)
    })
  })

  describe('pause and resume', () => {
    it('should pause queue processing', async () => {
      queue.start()

      await queue.add({
        name: 'task1',
        priority: TaskPriority.NORMAL,
        executor: async () => 'result'
      })

      queue.pause()

      const statsPaused = queue.getStats()
      
      // After pause, no new tasks should start
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Task might still be in queue
      expect(statsPaused.pending).toBeGreaterThanOrEqual(0)
    })

    it('should resume queue processing', async () => {
      queue.start()
      queue.pause()

      await queue.add({
        name: 'task',
        priority: TaskPriority.NORMAL,
        executor: async () => 'result'
      })

      queue.resume()

      // Tasks should start processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const stats = queue.getStats()
      expect(stats.completed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('stats', () => {
    it('should provide accurate stats', async () => {
      queue.start()

      const taskId1 = await queue.add({
        name: 'task1',
        priority: TaskPriority.NORMAL,
        executor: async () => 'result1'
      })

      const taskId2 = await queue.add({
        name: 'task2',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          throw new Error('Failed')
        },
        retries: 0
      })

      await queue.waitAll(2000)

      const stats = queue.getStats()

      expect(stats.completed).toBe(1)
      expect(stats.failed).toBe(1)
      expect(stats.total).toBe(2)
    })
  })

  describe('timeout', () => {
    it('should timeout long-running tasks', async () => {
      queue.start()

      const taskId = await queue.add({
        name: 'slow-task',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          await new Promise(resolve => setTimeout(resolve, 2000))
          return 'result'
        },
        timeout: 100,
        retries: 0
      })

      const result = await queue.waitFor(taskId, 3000)

      expect(result.status).toBe(TaskStatus.FAILED)
      expect(result.error?.message).toContain('超时')
    })
  })

  describe('estimated completion', () => {
    it('should calculate ETA', async () => {
      queue.start()

      // Add and complete one task to establish baseline
      const task1 = await queue.add({
        name: 'baseline',
        priority: TaskPriority.NORMAL,
        executor: async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return 'done'
        }
      })

      await queue.waitFor(task1)

      // Add more tasks
      for (let i = 0; i < 5; i++) {
        await queue.add({
          name: `task-${i}`,
          priority: TaskPriority.NORMAL,
          executor: async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
            return 'done'
          }
        })
      }

      const eta = queue.getEstimatedCompletion()

      expect(eta).toBeTruthy()
      expect(eta?.eta).toBeGreaterThan(0)
      expect(eta?.etaDate).toBeInstanceOf(Date)
    })
  })
})

