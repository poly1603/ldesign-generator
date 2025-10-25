import fs from 'fs-extra'
import path from 'path'
import prettier from 'prettier'
import { safeJoinPath, ensureDirectory, pathExists } from '../utils/path-helpers'
import { ErrorFactory } from './errors'

/**
 * 写入任务
 */
interface WriteTask {
  fileName: string
  content: string
  format: boolean
  resolve: (value: string) => void
  reject: (error: Error) => void
}

/**
 * 文件写入器 - 负责将生成的代码写入文件（支持队列和批量写入）
 */
export class FileWriter {
  private writeQueue: WriteTask[] = []
  private isProcessing = false
  private maxConcurrent = 5

  constructor(private outputDir: string) {}

  /**
   * 写入文件（增强版，带队列支持）
   */
  async write(fileName: string, content: string, format = true): Promise<string> {
    try {
      // 安全地连接路径
      const outputPath = safeJoinPath(this.outputDir, fileName)

      // 确保目录存在
      await ensureDirectory(path.dirname(outputPath))

      // 格式化代码（如果需要）
      let finalContent = content
      if (format) {
        try {
          finalContent = await this.formatCode(content, fileName)
        } catch (error) {
          console.warn('代码格式化失败，使用原始内容:', error)
        }
      }

      // 异步写入文件
      await fs.writeFile(outputPath, finalContent, 'utf-8')

      return outputPath
    } catch (error) {
      throw ErrorFactory.wrapError(error, { fileName, outputDir: this.outputDir })
    }
  }

  /**
   * 队列写入（用于批量操作）
   */
  async writeQueued(fileName: string, content: string, format = true): Promise<string> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ fileName, content, format, resolve, reject })
      this.processQueue()
    })
  }

  /**
   * 处理写入队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      // 批量处理（最多同时处理maxConcurrent个）
      while (this.writeQueue.length > 0) {
        const batch = this.writeQueue.splice(0, this.maxConcurrent)
        
        await Promise.allSettled(
          batch.map(async task => {
            try {
              const outputPath = await this.write(task.fileName, task.content, task.format)
              task.resolve(outputPath)
            } catch (error) {
              task.reject(error as Error)
            }
          })
        )
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 批量写入（并行）
   */
  async writeBatch(
    files: Array<{ fileName: string; content: string; format?: boolean }>
  ): Promise<string[]> {
    const results = await Promise.all(
      files.map(file => this.write(file.fileName, file.content, file.format !== false))
    )
    return results
  }

  /**
   * 检查文件是否存在
   */
  async exists(fileName: string): Promise<boolean> {
    const outputPath = safeJoinPath(this.outputDir, fileName)
    return await pathExists(outputPath)
  }

  /**
   * 备份现有文件
   */
  async backup(fileName: string): Promise<string | null> {
    const outputPath = safeJoinPath(this.outputDir, fileName)
    
    if (!(await pathExists(outputPath))) {
      return null
    }

    const backupPath = `${outputPath}.backup.${Date.now()}`
    await fs.copy(outputPath, backupPath)
    
    return backupPath
  }

  /**
   * 设置并发数
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, Math.min(max, 20))
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.writeQueue.length,
      processing: this.isProcessing
    }
  }

  /**
   * 格式化代码
   */
  private async formatCode(content: string, fileName: string): Promise<string> {
    const ext = path.extname(fileName)
    let parser: string

    switch (ext) {
      case '.ts':
      case '.tsx':
        parser = 'typescript'
        break
      case '.js':
      case '.jsx':
        parser = 'babel'
        break
      case '.json':
        parser = 'json'
        break
      case '.css':
      case '.less':
      case '.scss':
        parser = 'css'
        break
      case '.html':
        parser = 'html'
        break
      case '.vue':
        parser = 'vue'
        break
      default:
        return content
    }

    return prettier.format(content, { parser })
  }
}


