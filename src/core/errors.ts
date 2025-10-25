/**
 * 统一错误处理系统
 */

import { ErrorCode, ErrorSeverity, ErrorMetadata, FormattedError } from '../types/errors'

/**
 * 基础错误类
 */
export class GeneratorError extends Error {
  public readonly code: ErrorCode
  public readonly severity: ErrorSeverity
  public readonly context?: Record<string, any>
  public readonly suggestion?: string
  public readonly documentationUrl?: string
  public readonly cause?: Error
  public readonly timestamp: Date

  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(message)
    
    this.name = 'GeneratorError'
    this.code = metadata?.code || ErrorCode.UNKNOWN_ERROR
    this.severity = metadata?.severity || ErrorSeverity.MEDIUM
    this.context = metadata?.context
    this.suggestion = metadata?.suggestion
    this.documentationUrl = metadata?.documentationUrl
    this.cause = metadata?.cause
    this.timestamp = new Date()
    
    // 保持正确的原型链
    Object.setPrototypeOf(this, GeneratorError.prototype)
    
    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 格式化错误信息
   */
  toFormatted(): FormattedError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      suggestion: this.suggestion,
      documentationUrl: this.documentationUrl,
      stack: this.stack
    }
  }

  /**
   * 转换为 JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      suggestion: this.suggestion,
      documentationUrl: this.documentationUrl,
      stack: this.stack
    }
  }
}

/**
 * 模板错误
 */
export class TemplateError extends GeneratorError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(message, {
      ...metadata,
      code: metadata?.code || ErrorCode.TEMPLATE_RENDER_ERROR,
      severity: metadata?.severity || ErrorSeverity.HIGH
    })
    this.name = 'TemplateError'
    Object.setPrototypeOf(this, TemplateError.prototype)
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends GeneratorError {
  public readonly filePath?: string

  constructor(message: string, filePath?: string, metadata?: Partial<ErrorMetadata>) {
    super(message, {
      ...metadata,
      code: metadata?.code || ErrorCode.FILE_READ_ERROR,
      severity: metadata?.severity || ErrorSeverity.HIGH,
      context: { ...metadata?.context, filePath }
    })
    this.name = 'FileSystemError'
    this.filePath = filePath
    Object.setPrototypeOf(this, FileSystemError.prototype)
  }
}

/**
 * 配置错误
 */
export class ConfigError extends GeneratorError {
  constructor(message: string, metadata?: Partial<ErrorMetadata>) {
    super(message, {
      ...metadata,
      code: metadata?.code || ErrorCode.INVALID_CONFIG,
      severity: metadata?.severity || ErrorSeverity.HIGH
    })
    this.name = 'ConfigError'
    Object.setPrototypeOf(this, ConfigError.prototype)
  }
}

/**
 * 插件错误
 */
export class PluginError extends GeneratorError {
  public readonly pluginName?: string

  constructor(message: string, pluginName?: string, metadata?: Partial<ErrorMetadata>) {
    super(message, {
      ...metadata,
      code: metadata?.code || ErrorCode.PLUGIN_EXECUTION_ERROR,
      severity: metadata?.severity || ErrorSeverity.MEDIUM,
      context: { ...metadata?.context, pluginName }
    })
    this.name = 'PluginError'
    this.pluginName = pluginName
    Object.setPrototypeOf(this, PluginError.prototype)
  }
}

/**
 * 验证错误
 */
export class ValidationError extends GeneratorError {
  public readonly validationErrors?: Array<{ field: string; message: string }>

  constructor(
    message: string,
    validationErrors?: Array<{ field: string; message: string }>,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message, {
      ...metadata,
      code: metadata?.code || ErrorCode.VALIDATION_ERROR,
      severity: metadata?.severity || ErrorSeverity.MEDIUM,
      context: { ...metadata?.context, validationErrors }
    })
    this.name = 'ValidationError'
    this.validationErrors = validationErrors
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * 网络错误
 */
export class NetworkError extends GeneratorError {
  public readonly url?: string
  public readonly statusCode?: number

  constructor(
    message: string,
    url?: string,
    statusCode?: number,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message, {
      ...metadata,
      code: metadata?.code || ErrorCode.NETWORK_ERROR,
      severity: metadata?.severity || ErrorSeverity.MEDIUM,
      context: { ...metadata?.context, url, statusCode }
    })
    this.name = 'NetworkError'
    this.url = url
    this.statusCode = statusCode
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * 错误工厂函数
 */
export class ErrorFactory {
  /**
   * 创建模板未找到错误
   */
  static templateNotFound(templateName: string): TemplateError {
    return new TemplateError(
      `模板未找到: ${templateName}`,
      {
        code: ErrorCode.TEMPLATE_NOT_FOUND,
        severity: ErrorSeverity.HIGH,
        context: { templateName },
        suggestion: '请检查模板名称是否正确，或模板文件是否存在'
      }
    )
  }

  /**
   * 创建模板语法错误
   */
  static templateSyntaxError(templateName: string, cause: Error): TemplateError {
    return new TemplateError(
      `模板语法错误: ${templateName}`,
      {
        code: ErrorCode.TEMPLATE_SYNTAX_ERROR,
        severity: ErrorSeverity.HIGH,
        context: { templateName },
        cause,
        suggestion: '请检查模板语法是否正确'
      }
    )
  }

  /**
   * 创建文件未找到错误
   */
  static fileNotFound(filePath: string): FileSystemError {
    return new FileSystemError(
      `文件未找到: ${filePath}`,
      filePath,
      {
        code: ErrorCode.FILE_NOT_FOUND,
        severity: ErrorSeverity.HIGH,
        suggestion: '请确认文件路径是否正确'
      }
    )
  }

  /**
   * 创建文件已存在错误
   */
  static fileAlreadyExists(filePath: string): FileSystemError {
    return new FileSystemError(
      `文件已存在: ${filePath}`,
      filePath,
      {
        code: ErrorCode.FILE_ALREADY_EXISTS,
        severity: ErrorSeverity.MEDIUM,
        suggestion: '请使用 --force 选项覆盖现有文件，或选择不同的输出路径'
      }
    )
  }

  /**
   * 创建路径遍历错误
   */
  static pathTraversalAttempt(path: string): FileSystemError {
    return new FileSystemError(
      `检测到路径遍历攻击尝试: ${path}`,
      path,
      {
        code: ErrorCode.PATH_TRAVERSAL_ATTEMPT,
        severity: ErrorSeverity.CRITICAL,
        suggestion: '路径不能包含 ".." 或其他危险字符'
      }
    )
  }

  /**
   * 创建无效路径错误
   */
  static invalidPath(path: string, reason?: string): FileSystemError {
    return new FileSystemError(
      `无效的路径: ${path}${reason ? ` (${reason})` : ''}`,
      path,
      {
        code: ErrorCode.INVALID_PATH,
        severity: ErrorSeverity.HIGH,
        suggestion: '请提供有效的文件路径'
      }
    )
  }

  /**
   * 创建配置未找到错误
   */
  static configNotFound(searchPath: string): ConfigError {
    return new ConfigError(
      `配置文件未找到，搜索路径: ${searchPath}`,
      {
        code: ErrorCode.CONFIG_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        context: { searchPath },
        suggestion: '运行 "lgen init" 创建配置文件'
      }
    )
  }

  /**
   * 创建配置解析错误
   */
  static configParseError(filePath: string, cause: Error): ConfigError {
    return new ConfigError(
      `配置文件解析失败: ${filePath}`,
      {
        code: ErrorCode.CONFIG_PARSE_ERROR,
        severity: ErrorSeverity.HIGH,
        context: { filePath },
        cause,
        suggestion: '请检查配置文件的语法是否正确'
      }
    )
  }

  /**
   * 创建插件未找到错误
   */
  static pluginNotFound(pluginName: string): PluginError {
    return new PluginError(
      `插件未找到: ${pluginName}`,
      pluginName,
      {
        code: ErrorCode.PLUGIN_NOT_FOUND,
        severity: ErrorSeverity.MEDIUM,
        suggestion: '请确认插件名称是否正确，或插件是否已安装'
      }
    )
  }

  /**
   * 创建插件已注册错误
   */
  static pluginAlreadyRegistered(pluginName: string): PluginError {
    return new PluginError(
      `插件已注册: ${pluginName}`,
      pluginName,
      {
        code: ErrorCode.PLUGIN_ALREADY_REGISTERED,
        severity: ErrorSeverity.LOW,
        suggestion: '请使用不同的插件名称，或先卸载现有插件'
      }
    )
  }

  /**
   * 创建验证错误
   */
  static validationError(
    message: string,
    errors?: Array<{ field: string; message: string }>
  ): ValidationError {
    return new ValidationError(message, errors, {
      code: ErrorCode.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM
    })
  }

  /**
   * 创建输入验证错误
   */
  static inputValidationError(
    field: string,
    message: string
  ): ValidationError {
    return new ValidationError(
      `输入验证失败: ${field}`,
      [{ field, message }],
      {
        code: ErrorCode.INPUT_VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        suggestion: message
      }
    )
  }

  /**
   * 包装未知错误
   */
  static wrapError(error: unknown, context?: Record<string, any>): GeneratorError {
    if (error instanceof GeneratorError) {
      return error
    }

    if (error instanceof Error) {
      return new GeneratorError(error.message, {
        code: ErrorCode.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        cause: error,
        context
      })
    }

    return new GeneratorError(String(error), {
      code: ErrorCode.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      context
    })
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  /**
   * 处理错误（记录并格式化）
   */
  static handle(error: unknown): FormattedError {
    const generatorError = ErrorFactory.wrapError(error)
    
    // 这里可以添加日志记录
    // logger.error(generatorError.message, generatorError)
    
    return generatorError.toFormatted()
  }

  /**
   * 是否为可恢复错误
   */
  static isRecoverable(error: GeneratorError): boolean {
    return error.severity !== ErrorSeverity.CRITICAL
  }

  /**
   * 获取用户友好的错误消息
   */
  static getUserMessage(error: GeneratorError): string {
    let message = error.message
    
    if (error.suggestion) {
      message += `\n建议: ${error.suggestion}`
    }
    
    if (error.documentationUrl) {
      message += `\n文档: ${error.documentationUrl}`
    }
    
    return message
  }
}


