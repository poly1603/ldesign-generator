/**
 * 输入验证器
 * 验证用户输入，防止安全问题
 */

import { isPathSafe, isValidFileName, sanitizeFileName } from '../utils/path-helpers'
import { isEmpty } from '../utils/string-helpers'
import { ValidationError, ErrorFactory } from './errors'

/**
 * 验证结果
 */
export interface ValidateResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}

/**
 * 验证规则
 */
export type ValidationRule = (value: any) => string | null

/**
 * 输入验证器类
 */
export class InputValidator {
  /**
   * 验证是否为空
   */
  static required(fieldName: string): ValidationRule {
    return (value: any) => {
      if (value === null || value === undefined || isEmpty(String(value))) {
        return `${fieldName} 是必需的`
      }
      return null
    }
  }

  /**
   * 验证最小长度
   */
  static minLength(fieldName: string, min: number): ValidationRule {
    return (value: string) => {
      if (!value || value.length < min) {
        return `${fieldName} 至少需要 ${min} 个字符`
      }
      return null
    }
  }

  /**
   * 验证最大长度
   */
  static maxLength(fieldName: string, max: number): ValidationRule {
    return (value: string) => {
      if (value && value.length > max) {
        return `${fieldName} 不能超过 ${max} 个字符`
      }
      return null
    }
  }

  /**
   * 验证模式匹配
   */
  static pattern(fieldName: string, pattern: RegExp, message?: string): ValidationRule {
    return (value: string) => {
      if (value && !pattern.test(value)) {
        return message || `${fieldName} 格式不正确`
      }
      return null
    }
  }

  /**
   * 验证是否在枚举值中
   */
  static oneOf<T>(fieldName: string, values: T[]): ValidationRule {
    return (value: T) => {
      if (value && !values.includes(value)) {
        return `${fieldName} 必须是以下值之一: ${values.join(', ')}`
      }
      return null
    }
  }

  /**
   * 验证模板名称
   */
  static validateTemplateName(name: string): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    if (!name || isEmpty(name)) {
      errors.push({ field: 'templateName', message: '模板名称不能为空' })
      return { valid: false, errors }
    }

    // 检查是否包含路径分隔符
    if (name.includes('/') || name.includes('\\')) {
      errors.push({
        field: 'templateName',
        message: '模板名称不能包含路径分隔符'
      })
    }

    // 检查是否包含特殊字符
    const specialChars = /[<>:"|?*\x00-\x1f]/
    if (specialChars.test(name)) {
      errors.push({
        field: 'templateName',
        message: '模板名称包含非法字符'
      })
    }

    // 检查长度
    if (name.length > 255) {
      errors.push({
        field: 'templateName',
        message: '模板名称过长（最多 255 个字符）'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证文件路径
   */
  static validateFilePath(filePath: string, basePath?: string): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    if (!filePath || isEmpty(filePath)) {
      errors.push({ field: 'filePath', message: '文件路径不能为空' })
      return { valid: false, errors }
    }

    // 检查路径安全性
    if (!isPathSafe(filePath)) {
      errors.push({
        field: 'filePath',
        message: '文件路径包含不安全字符或路径遍历尝试'
      })
    }

    // 如果提供了基础路径，检查是否在允许范围内
    if (basePath) {
      const path = require('path')
      const resolvedPath = path.resolve(basePath, filePath)
      const resolvedBase = path.resolve(basePath)

      if (!resolvedPath.startsWith(resolvedBase)) {
        errors.push({
          field: 'filePath',
          message: '文件路径试图逃逸基础目录'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证文件名
   */
  static validateFileName(fileName: string): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    if (!fileName || isEmpty(fileName)) {
      errors.push({ field: 'fileName', message: '文件名不能为空' })
      return { valid: false, errors }
    }

    if (!isValidFileName(fileName)) {
      errors.push({
        field: 'fileName',
        message: '文件名包含非法字符或为保留名称'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证组件名称
   */
  static validateComponentName(name: string): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    if (!name || isEmpty(name)) {
      errors.push({ field: 'componentName', message: '组件名称不能为空' })
      return { valid: false, errors }
    }

    // 组件名应该是 PascalCase 或 kebab-case
    const validPattern = /^[A-Z][a-zA-Z0-9]*$|^[a-z][a-z0-9-]*$/
    if (!validPattern.test(name)) {
      errors.push({
        field: 'componentName',
        message: '组件名称应该是 PascalCase（如 MyButton）或 kebab-case（如 my-button）格式'
      })
    }

    // 检查长度
    if (name.length < 2) {
      errors.push({
        field: 'componentName',
        message: '组件名称至少需要 2 个字符'
      })
    }

    if (name.length > 50) {
      errors.push({
        field: 'componentName',
        message: '组件名称不能超过 50 个字符'
      })
    }

    // 不应该以数字开头
    if (/^\d/.test(name)) {
      errors.push({
        field: 'componentName',
        message: '组件名称不能以数字开头'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证 Props 定义
   */
  static validateProps(props: Array<{ name: string; type: string; default?: any }>): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    if (!Array.isArray(props)) {
      errors.push({ field: 'props', message: 'Props 必须是数组' })
      return { valid: false, errors }
    }

    props.forEach((prop, index) => {
      if (!prop.name || isEmpty(prop.name)) {
        errors.push({
          field: `props[${index}].name`,
          message: 'Prop 名称不能为空'
        })
      }

      if (!prop.type || isEmpty(prop.type)) {
        errors.push({
          field: `props[${index}].type`,
          message: 'Prop 类型不能为空'
        })
      }

      // Prop 名称应该是 camelCase
      const namePattern = /^[a-z][a-zA-Z0-9]*$/
      if (prop.name && !namePattern.test(prop.name)) {
        errors.push({
          field: `props[${index}].name`,
          message: 'Prop 名称应该是 camelCase 格式'
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证 API 端点定义
   */
  static validateEndpoint(endpoint: {
    name: string
    method: string
    path: string
  }): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    if (!endpoint.name || isEmpty(endpoint.name)) {
      errors.push({ field: 'endpoint.name', message: '端点名称不能为空' })
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    if (!validMethods.includes(endpoint.method)) {
      errors.push({
        field: 'endpoint.method',
        message: `HTTP 方法必须是: ${validMethods.join(', ')}`
      })
    }

    if (!endpoint.path || isEmpty(endpoint.path)) {
      errors.push({ field: 'endpoint.path', message: '端点路径不能为空' })
    } else if (!endpoint.path.startsWith('/')) {
      errors.push({
        field: 'endpoint.path',
        message: '端点路径应该以 / 开头'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证配置对象
   */
  static validateConfig(config: Record<string, any>, requiredFields: string[]): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    requiredFields.forEach(field => {
      if (!(field in config) || config[field] === null || config[field] === undefined) {
        errors.push({
          field,
          message: `配置字段 ${field} 是必需的`
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证并抛出错误
   */
  static validateOrThrow(result: ValidateResult, message = '验证失败'): void {
    if (!result.valid) {
      throw ErrorFactory.validationError(message, result.errors)
    }
  }

  /**
   * 组合验证器
   */
  static combine(...validators: ValidationRule[]): ValidationRule {
    return (value: any) => {
      for (const validator of validators) {
        const error = validator(value)
        if (error) return error
      }
      return null
    }
  }

  /**
   * 验证对象的多个字段
   */
  static validateFields(
    obj: Record<string, any>,
    rules: Record<string, ValidationRule[]>
  ): ValidateResult {
    const errors: Array<{ field: string; message: string }> = []

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = obj[field]

      for (const rule of fieldRules) {
        const error = rule(value)
        if (error) {
          errors.push({ field, message: error })
          break // 只报告每个字段的第一个错误
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 清理和验证文件名
   */
  static sanitizeAndValidateFileName(fileName: string): string {
    const sanitized = sanitizeFileName(fileName)
    const result = this.validateFileName(sanitized)

    if (!result.valid) {
      throw ErrorFactory.inputValidationError('fileName', result.errors[0].message)
    }

    return sanitized
  }

  /**
   * 验证 URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证邮箱
   */
  static isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  /**
   * 验证版本号（语义化版本）
   */
  static isValidSemanticVersion(version: string): boolean {
    const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
    return semverPattern.test(version)
  }
}

/**
 * 快捷验证函数
 */

/**
 * 验证模板名称（快捷方式）
 */
export function validateTemplateName(name: string): void {
  const result = InputValidator.validateTemplateName(name)
  InputValidator.validateOrThrow(result, '模板名称验证失败')
}

/**
 * 验证文件路径（快捷方式）
 */
export function validateFilePath(filePath: string, basePath?: string): void {
  const result = InputValidator.validateFilePath(filePath, basePath)
  InputValidator.validateOrThrow(result, '文件路径验证失败')
}

/**
 * 验证组件名称（快捷方式）
 */
export function validateComponentName(name: string): void {
  const result = InputValidator.validateComponentName(name)
  InputValidator.validateOrThrow(result, '组件名称验证失败')
}

export default InputValidator


