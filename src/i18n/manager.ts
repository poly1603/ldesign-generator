/**
 * 国际化管理器
 */

import type {
  SupportedLocale,
  TranslationKey,
  TranslationParams,
  LocaleConfig,
  TranslationMessages,
  I18nManager as II18nManager
} from '../types/i18n'

/**
 * 国际化管理器实现
 */
export class I18nManager implements II18nManager {
  private locale: SupportedLocale
  private fallbackLocale: SupportedLocale
  private messages: Map<SupportedLocale, TranslationMessages>
  private static instance: I18nManager

  constructor(config?: LocaleConfig) {
    this.locale = config?.locale || this.detectLocale()
    this.fallbackLocale = config?.fallbackLocale || 'en-US'
    this.messages = new Map()
    
    // 加载默认语言包
    this.loadDefaultMessages()
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: LocaleConfig): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager(config)
    }
    return I18nManager.instance
  }

  /**
   * 检测系统语言
   */
  private detectLocale(): SupportedLocale {
    const envLang = process.env.LANG || process.env.LANGUAGE || ''
    
    if (envLang.startsWith('zh')) {
      return 'zh-CN'
    } else if (envLang.startsWith('ja')) {
      return 'ja-JP'
    }
    
    return 'en-US'
  }

  /**
   * 加载默认语言包
   */
  private loadDefaultMessages(): void {
    try {
      // 动态导入语言文件
      const zhCN = require('./locales/zh-CN.json')
      const enUS = require('./locales/en-US.json')
      const jaJP = require('./locales/ja-JP.json')
      
      this.messages.set('zh-CN', zhCN)
      this.messages.set('en-US', enUS)
      this.messages.set('ja-JP', jaJP)
    } catch (error) {
      console.warn('加载默认语言包失败:', error)
    }
  }

  /**
   * 获取当前语言
   */
  getLocale(): SupportedLocale {
    return this.locale
  }

  /**
   * 设置语言
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale
  }

  /**
   * 翻译文本
   */
  t(key: TranslationKey, params?: TranslationParams): string {
    const message = this.getMessage(key, this.locale) || 
                   this.getMessage(key, this.fallbackLocale) ||
                   key

    return this.interpolate(message, params)
  }

  /**
   * 获取消息
   */
  private getMessage(key: TranslationKey, locale: SupportedLocale): string | undefined {
    const messages = this.messages.get(locale)
    if (!messages) return undefined

    // 支持嵌套键值，如 'error.fileNotFound'
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return undefined
      }
    }

    return typeof value === 'string' ? value : undefined
  }

  /**
   * 插值处理
   */
  private interpolate(message: string, params?: TranslationParams): string {
    if (!params) return message

    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  /**
   * 检查翻译键是否存在
   */
  has(key: TranslationKey): boolean {
    return this.getMessage(key, this.locale) !== undefined ||
           this.getMessage(key, this.fallbackLocale) !== undefined
  }

  /**
   * 加载语言包
   */
  loadMessages(locale: SupportedLocale, messages: TranslationMessages): void {
    const existing = this.messages.get(locale) || {}
    this.messages.set(locale, this.mergeMessages(existing, messages))
  }

  /**
   * 合并消息对象
   */
  private mergeMessages(
    target: TranslationMessages,
    source: TranslationMessages
  ): TranslationMessages {
    const result = { ...target }

    for (const key in source) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = this.mergeMessages(
          targetValue as TranslationMessages,
          sourceValue as TranslationMessages
        )
      } else {
        result[key] = sourceValue
      }
    }

    return result
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLocales(): SupportedLocale[] {
    return Array.from(this.messages.keys())
  }

  /**
   * 获取当前语言的所有消息
   */
  getAllMessages(locale?: SupportedLocale): TranslationMessages {
    return this.messages.get(locale || this.locale) || {}
  }

  /**
   * 清除语言包
   */
  clearMessages(locale?: SupportedLocale): void {
    if (locale) {
      this.messages.delete(locale)
    } else {
      this.messages.clear()
    }
  }

  /**
   * 格式化复数
   */
  plural(key: TranslationKey, count: number, params?: TranslationParams): string {
    const pluralKey = count === 1 ? `${key}.one` : `${key}.other`
    const message = this.getMessage(pluralKey, this.locale) || 
                   this.getMessage(key, this.locale) ||
                   key

    return this.interpolate(message, { ...params, count })
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    }[format]

    return new Intl.DateTimeFormat(this.locale, options).format(date)
  }

  /**
   * 格式化数字
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.locale, options).format(num)
  }

  /**
   * 格式化货币
   */
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency
    }).format(amount)
  }

  /**
   * 格式化相对时间
   */
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    return new Intl.RelativeTimeFormat(this.locale).format(value, unit)
  }
}

/**
 * 全局i18n实例
 */
export const i18n = I18nManager.getInstance()

/**
 * 便捷翻译函数
 */
export const t = (key: TranslationKey, params?: TranslationParams): string => {
  return i18n.t(key, params)
}

/**
 * 便捷复数函数
 */
export const plural = (key: TranslationKey, count: number, params?: TranslationParams): string => {
  return i18n.plural(key, count, params)
}

export default i18n


