/**
 * 错误类型定义
 */

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 通用错误 (1xxx)
  UNKNOWN_ERROR = 1000,
  INVALID_ARGUMENT = 1001,
  INVALID_OPERATION = 1002,
  NOT_IMPLEMENTED = 1003,
  
  // 文件系统错误 (2xxx)
  FILE_NOT_FOUND = 2000,
  FILE_ALREADY_EXISTS = 2001,
  FILE_READ_ERROR = 2002,
  FILE_WRITE_ERROR = 2003,
  DIRECTORY_NOT_FOUND = 2004,
  DIRECTORY_CREATE_ERROR = 2005,
  PERMISSION_DENIED = 2006,
  PATH_TRAVERSAL_ATTEMPT = 2007,
  INVALID_PATH = 2008,
  
  // 模板错误 (3xxx)
  TEMPLATE_NOT_FOUND = 3000,
  TEMPLATE_SYNTAX_ERROR = 3001,
  TEMPLATE_RENDER_ERROR = 3002,
  TEMPLATE_VALIDATION_ERROR = 3003,
  TEMPLATE_LOAD_ERROR = 3004,
  INVALID_TEMPLATE_NAME = 3005,
  TEMPLATE_COMPILE_ERROR = 3006,
  
  // 配置错误 (4xxx)
  CONFIG_NOT_FOUND = 4000,
  CONFIG_PARSE_ERROR = 4001,
  CONFIG_VALIDATION_ERROR = 4002,
  INVALID_CONFIG = 4003,
  
  // 插件错误 (5xxx)
  PLUGIN_NOT_FOUND = 5000,
  PLUGIN_LOAD_ERROR = 5001,
  PLUGIN_EXECUTION_ERROR = 5002,
  PLUGIN_ALREADY_REGISTERED = 5003,
  PLUGIN_DEPENDENCY_ERROR = 5004,
  
  // 生成错误 (6xxx)
  GENERATION_FAILED = 6000,
  BATCH_GENERATION_FAILED = 6001,
  DRY_RUN_FAILED = 6002,
  PREVIEW_FAILED = 6003,
  
  // 历史/回滚错误 (7xxx)
  HISTORY_NOT_FOUND = 7000,
  ROLLBACK_FAILED = 7001,
  HISTORY_SAVE_ERROR = 7002,
  
  // 网络/远程错误 (8xxx)
  NETWORK_ERROR = 8000,
  REMOTE_TEMPLATE_LOAD_ERROR = 8001,
  DOWNLOAD_FAILED = 8002,
  
  // 验证错误 (9xxx)
  VALIDATION_ERROR = 9000,
  INPUT_VALIDATION_ERROR = 9001,
  OUTPUT_VALIDATION_ERROR = 9002
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 错误元数据
 */
export interface ErrorMetadata {
  code: ErrorCode
  severity?: ErrorSeverity
  context?: Record<string, any>
  suggestion?: string
  documentationUrl?: string
  stack?: string
  cause?: Error
}

/**
 * 格式化的错误信息
 */
export interface FormattedError {
  code: ErrorCode
  message: string
  severity: ErrorSeverity
  timestamp: Date
  context?: Record<string, any>
  suggestion?: string
  documentationUrl?: string
  stack?: string
}


