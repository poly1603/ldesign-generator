// 核心生成器
export { Generator } from './generator'
export { TemplateEngine } from './template-engine'
export { FileWriter } from './file-writer'
export { ComponentGenerator } from './component-generator'
export { PageGenerator } from './page-generator'
export { ApiGenerator } from './api-generator'

// 插件系统
export { PluginManager, definePlugin } from './plugin-system'

// 配置管理
export { ConfigLoader, configLoader, loadConfig, createDefaultConfig } from './config-loader'
export type { FullConfig } from './config-loader'

// 日志系统
export { Logger, logger, createLogger, LogLevel } from './logger'
export type { LogEntry, LoggerConfig } from './logger'

// 缓存系统
export { CacheManager, cacheManager, createCacheManager } from './cache-manager'
export type { CacheManagerConfig } from './cache-manager'

// 模板验证
export { TemplateValidator, createValidator, validate, ValidationSeverity } from './template-validator'
export type { ValidationResult, ValidationIssue, ValidatorConfig, ValidationRule } from './template-validator'

// 干运行
export { DryRunGenerator, createDryRunGenerator } from './dry-run-generator'
export type { DryRunResult, DryRunFile } from './dry-run-generator'

// 批量生成
export { BatchGenerator, createBatchGenerator } from './batch-generator'
export type { BatchConfig, BatchGenerateOptions, BatchGenerateResult } from './batch-generator'

// 历史管理
export { HistoryManager, historyManager } from './history-manager'
export type { HistoryEntry, QueryOptions } from './history-manager'

// 回滚管理
export { RollbackManager, rollbackManager } from './rollback-manager'
export type { RollbackOptions, RollbackResult } from './rollback-manager'

// 性能监控
export { PerformanceMonitor, performanceMonitor, monitored } from './performance-monitor'
export type { PerformanceMetrics, PerformanceStats } from './performance-monitor'

// 代码预览
export { PreviewGenerator, createPreviewGenerator } from './preview-generator'
export type { PreviewOptions, PreviewResult } from './preview-generator'


