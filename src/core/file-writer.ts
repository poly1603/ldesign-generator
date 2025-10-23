import fs from 'fs-extra'
import path from 'path'
import prettier from 'prettier'

/**
 * 文件写入器 - 负责将生成的代码写入文件
 */
export class FileWriter {
  constructor(private outputDir: string) { }

  /**
   * 写入文件
   */
  async write(fileName: string, content: string, format = true): Promise<string> {
    const outputPath = path.join(this.outputDir, fileName)

    // 确保目录存在
    await fs.ensureDir(path.dirname(outputPath))

    // 格式化代码（如果需要）
    let finalContent = content
    if (format) {
      try {
        finalContent = await this.formatCode(content, fileName)
      } catch (error) {
        console.warn('代码格式化失败，使用原始内容:', error)
      }
    }

    // 写入文件
    await fs.writeFile(outputPath, finalContent, 'utf-8')

    return outputPath
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


