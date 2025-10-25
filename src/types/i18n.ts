/**
 * 国际化类型定义
 */

/**
 * 支持的语言
 */
export type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP'

/**
 * 翻译键类型
 */
export type TranslationKey = string

/**
 * 翻译函数参数
 */
export interface TranslationParams {
  [key: string]: string | number
}

/**
 * 语言配置
 */
export interface LocaleConfig {
  locale: SupportedLocale
  fallbackLocale?: SupportedLocale
}

/**
 * 翻译消息对象
 */
export interface TranslationMessages {
  [key: string]: string | TranslationMessages
}

/**
 * i18n 管理器接口
 */
export interface I18nManager {
  /**
   * 获取当前语言
   */
  getLocale(): SupportedLocale
  
  /**
   * 设置语言
   */
  setLocale(locale: SupportedLocale): void
  
  /**
   * 翻译文本
   */
  t(key: TranslationKey, params?: TranslationParams): string
  
  /**
   * 检查翻译键是否存在
   */
  has(key: TranslationKey): boolean
  
  /**
   * 加载语言包
   */
  loadMessages(locale: SupportedLocale, messages: TranslationMessages): void
}


