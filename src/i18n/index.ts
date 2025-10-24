import fs from 'fs-extra'
import path from 'path'

/**
 * 支持的语言
 */
export type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP'

/**
 * 翻译键值对
 */
export type TranslationKey = string
export type TranslationValue = string | Record<string, any>
export type Translations = Record<TranslationKey, TranslationValue>

/**
 * i18n 管理器
 */
export class I18nManager {
  private locale: SupportedLocale = 'zh-CN'
  private translations: Map<SupportedLocale, Translations> = new Map()
  private fallbackLocale: SupportedLocale = 'en-US'
  private static instance: I18nManager

  constructor() {
    this.loadTranslations()
    this.detectLocale()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager()
    }
    return I18nManager.instance
  }

  /**
   * 加载翻译文件
   */
  private loadTranslations(): void {
    const locales: SupportedLocale[] = ['zh-CN', 'en-US', 'ja-JP']

    locales.forEach(locale => {
      try {
        const filePath = path.join(__dirname, 'locales', `${locale}.json`)

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          this.translations.set(locale, JSON.parse(content))
        }
      } catch (error) {
        console.warn(`警告: 无法加载语言包 ${locale}`)
      }
    })
  }

  /**
   * 自动检测语言
   */
  private detectLocale(): void {
    const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || ''

    if (envLang.includes('zh') || envLang.includes('CN')) {
      this.locale = 'zh-CN'
    } else if (envLang.includes('ja') || envLang.includes('JP')) {
      this.locale = 'ja-JP'
    } else {
      this.locale = 'en-US'
    }
  }

  /**
   * 设置当前语言
   */
  setLocale(locale: SupportedLocale): void {
    if (!this.translations.has(locale)) {
      console.warn(`警告: 语言 ${locale} 未加载，使用回退语言`)
      return
    }

    this.locale = locale
  }

  /**
   * 获取当前语言
   */
  getLocale(): SupportedLocale {
    return this.locale
  }

  /**
   * 翻译文本
   */
  t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key)

    if (!translation) {
      return key
    }

    if (typeof translation !== 'string') {
      return key
    }

    // 替换参数
    if (params) {
      return this.interpolate(translation, params)
    }

    return translation
  }

  /**
   * 获取翻译
   */
  private getTranslation(key: string): TranslationValue | undefined {
    const keys = key.split('.')
    let current: any = this.translations.get(this.locale)

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        // 尝试回退语言
        current = this.translations.get(this.fallbackLocale)
        for (const k2 of keys) {
          if (current && typeof current === 'object' && k2 in current) {
            current = current[k2]
          } else {
            return undefined
          }
        }
        break
      }
    }

    return current
  }

  /**
   * 插值替换
   */
  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLocales(): SupportedLocale[] {
    return Array.from(this.translations.keys())
  }

  /**
   * 检查是否支持某个语言
   */
  hasLocale(locale: SupportedLocale): boolean {
    return this.translations.has(locale)
  }
}

/**
 * 全局 i18n 实例
 */
export const i18n = I18nManager.getInstance()

/**
 * 翻译函数快捷方式
 */
export const t = i18n.t.bind(i18n)

export default i18n


