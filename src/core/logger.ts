import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, any>
  error?: Error
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  level: LogLevel
  enableFile: boolean
  enableConsole: boolean
  logDir: string
  maxFileSize: number // MB
  maxFiles: number
  dateFormat: string
}

/**
 * 高级日志管理器
 */
export class Logger {
  private config: LoggerConfig
  private currentLogFile: string | null = null
  private buffer: LogEntry[] = []
  private bufferSize = 100
  private static instance: Logger

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      enableFile: true,
      enableConsole: true,
      logDir: path.join(os.homedir(), '.ldesign', 'logs'),
      maxFileSize: 10, // 10MB
      maxFiles: 5,
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      ...config
    }

    this.initLogDir()
    this.initLogFile()
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config)
    }
    return Logger.instance
  }

  /**
   * 初始化日志目录
   */
  private initLogDir(): void {
    if (this.config.enableFile) {
      fs.ensureDirSync(this.config.logDir)
    }
  }

  /**
   * 初始化日志文件
   */
  private initLogFile(): void {
    if (!this.config.enableFile) return

    const date = new Date().toISOString().split('T')[0]
    this.currentLogFile = path.join(this.config.logDir, `generator-${date}.log`)

    // 检查并轮转日志文件
    this.rotateLogsIfNeeded()
  }

  /**
   * 日志轮转
   */
  private rotateLogsIfNeeded(): void {
    if (!this.currentLogFile) return

    // 检查当前日志文件大小
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile)
      const sizeMB = stats.size / (1024 * 1024)

      if (sizeMB >= this.config.maxFileSize) {
        // 重命名当前文件
        const timestamp = Date.now()
        const newName = this.currentLogFile.replace('.log', `-${timestamp}.log`)
        fs.renameSync(this.currentLogFile, newName)

        // 清理旧日志文件
        this.cleanOldLogs()
      }
    }
  }

  /**
   * 清理旧日志文件
   */
  private cleanOldLogs(): void {
    const files = fs.readdirSync(this.config.logDir)
      .filter(f => f.startsWith('generator-') && f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: path.join(this.config.logDir, f),
        time: fs.statSync(path.join(this.config.logDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)

    // 保留最新的 N 个文件
    files.slice(this.config.maxFiles).forEach(file => {
      fs.removeSync(file.path)
    })
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level < this.config.level) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    }

    // 控制台输出
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // 文件输出
    if (this.config.enableFile) {
      this.buffer.push(entry)
      if (this.buffer.length >= this.bufferSize) {
        this.flush()
      }
    }
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = this.formatDate(entry.timestamp)
    const levelStr = LogLevel[entry.level].padEnd(5)

    let colorFn: typeof chalk.gray
    let icon: string

    switch (entry.level) {
      case LogLevel.DEBUG:
        colorFn = chalk.gray
        icon = '🔍'
        break
      case LogLevel.INFO:
        colorFn = chalk.blue
        icon = 'ℹ️'
        break
      case LogLevel.WARN:
        colorFn = chalk.yellow
        icon = '⚠️'
        break
      case LogLevel.ERROR:
        colorFn = chalk.red
        icon = '❌'
        break
      default:
        colorFn = chalk.white
        icon = '•'
    }

    console.log(colorFn(`[${timestamp}] ${icon} ${levelStr} ${entry.message}`))

    if (entry.context) {
      console.log(chalk.gray('  Context:'), entry.context)
    }

    if (entry.error) {
      console.error(chalk.red('  Error:'), entry.error.message)
      if (entry.level === LogLevel.DEBUG) {
        console.error(chalk.gray(entry.error.stack))
      }
    }
  }

  /**
   * 刷新缓冲区到文件
   */
  private flush(): void {
    if (this.buffer.length === 0 || !this.currentLogFile) return

    const lines = this.buffer.map(entry => {
      const timestamp = this.formatDate(entry.timestamp)
      const level = LogLevel[entry.level].padEnd(5)
      let line = `[${timestamp}] ${level} ${entry.message}`

      if (entry.context) {
        line += ` | Context: ${JSON.stringify(entry.context)}`
      }

      if (entry.error) {
        line += ` | Error: ${entry.error.message}`
        if (entry.error.stack) {
          line += `\n${entry.error.stack}`
        }
      }

      return line
    }).join('\n') + '\n'

    fs.appendFileSync(this.currentLogFile, lines, 'utf-8')
    this.buffer = []
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * INFO 级别日志
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * 启用/禁用控制台输出
   */
  setConsoleEnabled(enabled: boolean): void {
    this.config.enableConsole = enabled
  }

  /**
   * 启用/禁用文件输出
   */
  setFileEnabled(enabled: boolean): void {
    this.config.enableFile = enabled
    if (enabled) {
      this.initLogDir()
      this.initLogFile()
    }
  }

  /**
   * 获取日志文件路径
   */
  getLogFile(): string | null {
    return this.currentLogFile
  }

  /**
   * 清空缓冲区（确保所有日志被写入）
   */
  close(): void {
    this.flush()
  }

  /**
   * 搜索日志
   */
  async searchLogs(options: {
    keyword?: string
    level?: LogLevel
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<LogEntry[]> {
    const results: LogEntry[] = []

    if (!this.currentLogFile) return results

    const content = await fs.readFile(this.currentLogFile, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      // 简单的解析（实际使用中可能需要更复杂的解析）
      if (options.keyword && !line.includes(options.keyword)) {
        continue
      }

      // TODO: 实现更复杂的过滤逻辑

      if (results.length >= (options.limit || 100)) {
        break
      }
    }

    return results
  }

  /**
   * 导出日志
   */
  async exportLogs(outputPath: string, format: 'text' | 'json' = 'text'): Promise<void> {
    if (!this.currentLogFile) return

    const content = await fs.readFile(this.currentLogFile, 'utf-8')

    if (format === 'json') {
      // 转换为 JSON 格式
      const lines = content.split('\n').filter(l => l.trim())
      const jsonContent = JSON.stringify(lines, null, 2)
      await fs.writeFile(outputPath, jsonContent, 'utf-8')
    } else {
      // 直接复制文本格式
      await fs.copy(this.currentLogFile, outputPath)
    }
  }
}

/**
 * 默认日志实例
 */
export const logger = Logger.getInstance()

/**
 * 创建日志实例
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config)
}

export default logger


