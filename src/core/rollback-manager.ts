import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { historyManager, type HistoryEntry } from './history-manager'
import { logger } from './logger'

/**
 * 回滚选项
 */
export interface RollbackOptions {
  force?: boolean
  backup?: boolean
  dryRun?: boolean
  interactive?: boolean
}

/**
 * 回滚结果
 */
export interface RollbackResult {
  success: boolean
  filesDeleted: number
  filesSkipped: number
  errors: string[]
  backupPath?: string
}

/**
 * 回滚管理器 - 撤销生成操作
 */
export class RollbackManager {
  private static instance: RollbackManager

  /**
   * 获取单例实例
   */
  static getInstance(): RollbackManager {
    if (!RollbackManager.instance) {
      RollbackManager.instance = new RollbackManager()
    }
    return RollbackManager.instance
  }

  /**
   * 回滚指定的历史记录
   */
  async rollback(historyId: string, options?: RollbackOptions): Promise<RollbackResult> {
    const force = options?.force ?? false
    const backup = options?.backup ?? true
    const dryRun = options?.dryRun ?? false
    const interactive = options?.interactive ?? true

    logger.info(`开始回滚操作: ${historyId}`, { force, backup, dryRun })

    const entry = historyManager.getById(historyId)

    if (!entry) {
      throw new Error(`未找到历史记录: ${historyId}`)
    }

    if (!entry.success) {
      logger.warn('该历史记录标记为失败，可能没有创建文件')
    }

    const result: RollbackResult = {
      success: true,
      filesDeleted: 0,
      filesSkipped: 0,
      errors: [],
      backupPath: backup ? await this.createBackupPath(historyId) : undefined
    }

    // 交互式确认
    if (interactive && !dryRun) {
      const confirmed = await this.confirmRollback(entry)

      if (!confirmed) {
        logger.info('用户取消回滚操作')
        result.success = false
        return result
      }
    }

    // 处理每个文件
    for (const file of entry.files) {
      if (file.action === 'delete') {
        // 跳过删除操作的回滚（不恢复删除的文件）
        result.filesSkipped++
        continue
      }

      try {
        // 检查文件是否存在
        if (!(await fs.pathExists(file.path))) {
          logger.debug(`文件不存在，跳过: ${file.path}`)
          result.filesSkipped++
          continue
        }

        // 安全检查：文件是否被修改
        if (!force && file.action === 'overwrite') {
          const modified = await this.isFileModified(file.path, file.hash)

          if (modified) {
            logger.warn(`文件已被修改，跳过删除: ${file.path}`)
            result.filesSkipped++
            result.errors.push(`文件已被修改: ${file.path}`)
            continue
          }
        }

        // 备份文件
        if (backup && result.backupPath) {
          await this.backupFile(file.path, result.backupPath)
        }

        // 干运行模式
        if (dryRun) {
          logger.debug(`[DRY-RUN] 将删除: ${file.path}`)
          result.filesDeleted++
          continue
        }

        // 删除文件
        await fs.remove(file.path)
        result.filesDeleted++
        logger.debug(`已删除文件: ${file.path}`)
      } catch (error) {
        const errorMsg = `删除失败 ${file.path}: ${(error as Error).message}`
        result.errors.push(errorMsg)
        logger.error(errorMsg, error as Error)
      }
    }

    // 更新结果
    result.success = result.errors.length === 0

    logger.info('回滚操作完成', {
      success: result.success,
      deleted: result.filesDeleted,
      skipped: result.filesSkipped,
      errors: result.errors.length
    })

    return result
  }

  /**
   * 回滚最近的操作
   */
  async rollbackLast(options?: RollbackOptions): Promise<RollbackResult> {
    const recent = historyManager.getRecent(1)

    if (recent.length === 0) {
      throw new Error('没有可回滚的历史记录')
    }

    return await this.rollback(recent[0].id, options)
  }

  /**
   * 批量回滚
   */
  async rollbackMultiple(historyIds: string[], options?: RollbackOptions): Promise<RollbackResult[]> {
    const results: RollbackResult[] = []

    for (const id of historyIds) {
      try {
        const result = await this.rollback(id, {
          ...options,
          interactive: false // 批量回滚时禁用交互
        })
        results.push(result)
      } catch (error) {
        logger.error(`回滚失败 ${id}`, error as Error)
        results.push({
          success: false,
          filesDeleted: 0,
          filesSkipped: 0,
          errors: [(error as Error).message]
        })
      }
    }

    return results
  }

  /**
   * 确认回滚操作
   */
  private async confirmRollback(entry: HistoryEntry): Promise<boolean> {
    console.log('\n' + chalk.bold.yellow('⚠️  回滚确认'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(`操作 ID: ${entry.id}`)
    console.log(`时间: ${entry.timestamp.toLocaleString()}`)
    console.log(`模板: ${entry.templateName}`)
    console.log(`文件数: ${entry.files.length}`)
    console.log(chalk.gray('─'.repeat(60)))
    console.log('\n将要删除的文件:')

    entry.files.forEach((file, index) => {
      if (file.action !== 'delete') {
        console.log(`  ${index + 1}. ${file.path}`)
      }
    })

    console.log()

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('确定要回滚此操作吗？'),
        default: false
      }
    ])

    return answer.confirm
  }

  /**
   * 检查文件是否被修改
   */
  private async isFileModified(filePath: string, originalHash?: string): Promise<boolean> {
    if (!originalHash) {
      // 没有原始哈希，假定未修改
      return false
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const currentHash = this.simpleHash(content)

      return currentHash !== originalHash
    } catch {
      return false
    }
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  /**
   * 创建备份路径
   */
  private async createBackupPath(historyId: string): Promise<string> {
    const backupDir = path.join(os.homedir(), '.ldesign', 'backups', historyId)
    await fs.ensureDir(backupDir)
    return backupDir
  }

  /**
   * 备份文件
   */
  private async backupFile(filePath: string, backupDir: string): Promise<void> {
    const fileName = path.basename(filePath)
    const backupPath = path.join(backupDir, fileName)

    await fs.copy(filePath, backupPath)
    logger.debug(`文件已备份: ${filePath} -> ${backupPath}`)
  }

  /**
   * 显示回滚结果
   */
  static displayResult(result: RollbackResult): void {
    console.log('\n' + chalk.bold.cyan('📊 回滚结果:'))
    console.log(chalk.gray('═'.repeat(60)))

    if (result.success) {
      console.log(chalk.green('\n✓ 回滚成功'))
    } else {
      console.log(chalk.red('\n✗ 回滚失败'))
    }

    console.log(`\n  删除文件: ${chalk.cyan(result.filesDeleted)}`)
    console.log(`  跳过文件: ${chalk.yellow(result.filesSkipped)}`)
    console.log(`  错误数: ${chalk.red(result.errors.length)}`)

    if (result.backupPath) {
      console.log(`  备份路径: ${chalk.gray(result.backupPath)}`)
    }

    if (result.errors.length > 0) {
      console.log(chalk.bold.red('\n错误列表:'))
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }

    console.log(chalk.gray('\n' + '═'.repeat(60) + '\n'))
  }
}

/**
 * 全局回滚管理器实例
 */
export const rollbackManager = RollbackManager.getInstance()

export default rollbackManager


