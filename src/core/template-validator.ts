import ejs from 'ejs'
import Handlebars from 'handlebars'

/**
 * 验证问题严重程度
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * 验证问题
 */
export interface ValidationIssue {
  severity: ValidationSeverity
  message: string
  line?: number
  column?: number
  rule: string
  suggestion?: string
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  warnings: number
  errors: number
}

/**
 * 验证规则配置
 */
export interface ValidatorConfig {
  checkSyntax: boolean
  checkRequiredFields: boolean
  checkBestPractices: boolean
  requiredFields?: string[]
  customRules?: ValidationRule[]
}

/**
 * 自定义验证规则
 */
export interface ValidationRule {
  name: string
  check: (content: string, data?: any) => ValidationIssue[]
}

/**
 * 模板验证器
 */
export class TemplateValidator {
  private config: ValidatorConfig

  constructor(config?: Partial<ValidatorConfig>) {
    this.config = {
      checkSyntax: true,
      checkRequiredFields: true,
      checkBestPractices: true,
      requiredFields: [],
      customRules: [],
      ...config
    }
  }

  /**
   * 验证模板
   */
  validate(
    templateContent: string,
    templateType: 'ejs' | 'handlebars' | 'auto' = 'auto',
    data?: any
  ): ValidationResult {
    const issues: ValidationIssue[] = []

    // 自动检测模板类型
    if (templateType === 'auto') {
      templateType = this.detectTemplateType(templateContent)
    }

    // 语法检查
    if (this.config.checkSyntax) {
      issues.push(...this.checkSyntax(templateContent, templateType))
    }

    // 必需字段检查
    if (this.config.checkRequiredFields && this.config.requiredFields) {
      issues.push(...this.checkRequiredFields(templateContent, this.config.requiredFields))
    }

    // 最佳实践检查
    if (this.config.checkBestPractices) {
      issues.push(...this.checkBestPractices(templateContent, templateType))
    }

    // 自定义规则检查
    if (this.config.customRules) {
      for (const rule of this.config.customRules) {
        issues.push(...rule.check(templateContent, data))
      }
    }

    const errors = issues.filter(i => i.severity === ValidationSeverity.ERROR).length
    const warnings = issues.filter(i => i.severity === ValidationSeverity.WARNING).length

    return {
      valid: errors === 0,
      issues,
      warnings,
      errors
    }
  }

  /**
   * 检测模板类型
   */
  private detectTemplateType(content: string): 'ejs' | 'handlebars' {
    // 检查 EJS 标记
    if (content.includes('<%') || content.includes('%>')) {
      return 'ejs'
    }

    // 检查 Handlebars 标记
    if (content.includes('{{') || content.includes('}}')) {
      return 'handlebars'
    }

    // 默认 EJS
    return 'ejs'
  }

  /**
   * 语法检查
   */
  private checkSyntax(content: string, type: 'ejs' | 'handlebars'): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    try {
      if (type === 'ejs') {
        // 尝试编译 EJS 模板
        ejs.compile(content)
      } else {
        // 尝试编译 Handlebars 模板
        Handlebars.compile(content)
      }
    } catch (error) {
      const err = error as Error
      issues.push({
        severity: ValidationSeverity.ERROR,
        message: `语法错误: ${err.message}`,
        rule: 'syntax',
        suggestion: '请检查模板语法是否正确'
      })
    }

    return issues
  }

  /**
   * 必需字段检查
   */
  private checkRequiredFields(content: string, requiredFields: string[]): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    for (const field of requiredFields) {
      const ejsPattern = new RegExp(`<%[=\\-]?\\s*${field}\\s*%>`)
      const hbsPattern = new RegExp(`{{\\s*${field}\\s*}}`)

      if (!ejsPattern.test(content) && !hbsPattern.test(content)) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          message: `缺少必需字段: ${field}`,
          rule: 'required-field',
          suggestion: `请在模板中使用字段 <%= ${field} %> 或 {{ ${field} }}`
        })
      }
    }

    return issues
  }

  /**
   * 最佳实践检查
   */
  private checkBestPractices(content: string, type: 'ejs' | 'handlebars'): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // 检查是否使用了未转义的输出（安全性）
    if (type === 'ejs') {
      const unescapedMatches = content.match(/<%[-=]\s/g)
      if (unescapedMatches) {
        issues.push({
          severity: ValidationSeverity.INFO,
          message: `发现 ${unescapedMatches.length} 个未转义的输出`,
          rule: 'unescaped-output',
          suggestion: '考虑使用 <%= %> 代替 <%- %> 以防止 XSS 攻击'
        })
      }
    }

    // 检查过长的行
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push({
          severity: ValidationSeverity.INFO,
          message: `第 ${index + 1} 行过长（${line.length} 字符）`,
          line: index + 1,
          rule: 'line-length',
          suggestion: '建议将长行拆分以提高可读性（建议不超过 120 字符）'
        })
      }
    })

    // 检查是否有注释
    const hasComments = content.includes('<!--') || content.includes('<%#') || content.includes('{{!')
    if (!hasComments && content.length > 100) {
      issues.push({
        severity: ValidationSeverity.INFO,
        message: '模板缺少注释',
        rule: 'missing-comments',
        suggestion: '添加注释有助于提高模板的可维护性'
      })
    }

    // 检查缩进一致性
    const indentIssues = this.checkIndentation(content)
    issues.push(...indentIssues)

    // 检查是否使用了内联样式（不推荐）
    if (content.includes('style=')) {
      issues.push({
        severity: ValidationSeverity.WARNING,
        message: '检测到内联样式',
        rule: 'inline-style',
        suggestion: '建议使用外部样式表或 CSS 类'
      })
    }

    // 检查是否有硬编码的值
    const hardcodedPatterns = [
      /localhost:\d+/g,
      /127\.0\.0\.1/g,
      /http:\/\//g
    ]

    hardcodedPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          message: `检测到硬编码的值: ${pattern.source}`,
          rule: 'hardcoded-value',
          suggestion: '建议使用配置变量代替硬编码的值'
        })
      }
    })

    return issues
  }

  /**
   * 检查缩进一致性
   */
  private checkIndentation(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const lines = content.split('\n')

    let usesSpaces: boolean | null = null
    let indentSize: number | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const leadingWhitespace = line.match(/^(\s+)/)?.[1]

      if (!leadingWhitespace) continue

      const hasSpaces = /^ +/.test(leadingWhitespace)
      const hasTabs = /^\t+/.test(leadingWhitespace)

      // 检测混合使用空格和制表符
      if (hasSpaces && hasTabs) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          message: `第 ${i + 1} 行混合使用了空格和制表符`,
          line: i + 1,
          rule: 'mixed-indentation',
          suggestion: '统一使用空格或制表符进行缩进'
        })
        continue
      }

      // 记录缩进类型
      if (usesSpaces === null) {
        usesSpaces = hasSpaces
      } else if ((usesSpaces && hasTabs) || (!usesSpaces && hasSpaces)) {
        issues.push({
          severity: ValidationSeverity.INFO,
          message: `第 ${i + 1} 行的缩进类型与其他行不一致`,
          line: i + 1,
          rule: 'inconsistent-indentation',
          suggestion: `建议统一使用${usesSpaces ? '空格' : '制表符'}缩进`
        })
      }

      // 检测缩进大小
      if (hasSpaces) {
        const spaceCount = leadingWhitespace.length
        if (indentSize === null && spaceCount > 0) {
          // 假设第一个缩进的大小是标准
          indentSize = spaceCount
        } else if (indentSize && spaceCount % indentSize !== 0) {
          issues.push({
            severity: ValidationSeverity.INFO,
            message: `第 ${i + 1} 行的缩进大小不是 ${indentSize} 的倍数`,
            line: i + 1,
            rule: 'indentation-size',
            suggestion: `建议使用 ${indentSize} 个空格作为缩进单位`
          })
        }
      }
    }

    return issues
  }

  /**
   * 添加自定义规则
   */
  addRule(rule: ValidationRule): void {
    if (!this.config.customRules) {
      this.config.customRules = []
    }
    this.config.customRules.push(rule)
  }

  /**
   * 移除自定义规则
   */
  removeRule(ruleName: string): void {
    if (this.config.customRules) {
      this.config.customRules = this.config.customRules.filter(r => r.name !== ruleName)
    }
  }

  /**
   * 格式化验证结果
   */
  static formatResult(result: ValidationResult): string {
    if (result.valid && result.issues.length === 0) {
      return '✓ 模板验证通过，未发现问题'
    }

    const lines: string[] = []

    lines.push(`验证结果: ${result.valid ? '✓ 通过' : '✗ 失败'}`)
    lines.push(`错误: ${result.errors}, 警告: ${result.warnings}, 信息: ${result.issues.length - result.errors - result.warnings}`)
    lines.push('')

    if (result.issues.length > 0) {
      lines.push('问题列表:')

      result.issues.forEach((issue, index) => {
        const icon = {
          [ValidationSeverity.ERROR]: '✗',
          [ValidationSeverity.WARNING]: '⚠',
          [ValidationSeverity.INFO]: 'ℹ'
        }[issue.severity]

        const location = issue.line ? ` (第 ${issue.line} 行)` : ''
        lines.push(`${index + 1}. ${icon} [${issue.severity.toUpperCase()}]${location} ${issue.message}`)

        if (issue.suggestion) {
          lines.push(`   建议: ${issue.suggestion}`)
        }

        lines.push('')
      })
    }

    return lines.join('\n')
  }
}

/**
 * 创建验证器实例
 */
export function createValidator(config?: Partial<ValidatorConfig>): TemplateValidator {
  return new TemplateValidator(config)
}

/**
 * 快速验证函数
 */
export function validate(
  templateContent: string,
  templateType?: 'ejs' | 'handlebars' | 'auto',
  config?: Partial<ValidatorConfig>
): ValidationResult {
  const validator = new TemplateValidator(config)
  return validator.validate(templateContent, templateType)
}

export default TemplateValidator


