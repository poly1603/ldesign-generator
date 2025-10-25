/**
 * 字符串转换辅助工具
 * 提供各种命名格式转换功能
 */

/**
 * 转换为 camelCase
 * @param str - 输入字符串
 * @returns camelCase 格式的字符串
 * @example
 * toCamelCase('hello-world') // 'helloWorld'
 * toCamelCase('HelloWorld') // 'helloWorld'
 */
export function toCamelCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase())
}

/**
 * 转换为 PascalCase
 * @param str - 输入字符串
 * @returns PascalCase 格式的字符串
 * @example
 * toPascalCase('hello-world') // 'HelloWorld'
 * toPascalCase('helloWorld') // 'HelloWorld'
 */
export function toPascalCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}

/**
 * 转换为 kebab-case
 * @param str - 输入字符串
 * @returns kebab-case 格式的字符串
 * @example
 * toKebabCase('HelloWorld') // 'hello-world'
 * toKebabCase('helloWorld') // 'hello-world'
 */
export function toKebabCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * 转换为 snake_case
 * @param str - 输入字符串
 * @returns snake_case 格式的字符串
 * @example
 * toSnakeCase('HelloWorld') // 'hello_world'
 * toSnakeCase('hello-world') // 'hello_world'
 */
export function toSnakeCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * 转换为 CONSTANT_CASE
 * @param str - 输入字符串
 * @returns CONSTANT_CASE 格式的字符串
 * @example
 * toConstantCase('helloWorld') // 'HELLO_WORLD'
 */
export function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase()
}

/**
 * 转换为 Title Case
 * @param str - 输入字符串
 * @returns Title Case 格式的字符串
 * @example
 * toTitleCase('hello world') // 'Hello World'
 */
export function toTitleCase(str: string): string {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * 转换为点分隔格式
 * @param str - 输入字符串
 * @returns dot.case 格式的字符串
 * @example
 * toDotCase('HelloWorld') // 'hello.world'
 */
export function toDotCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1.$2')
    .replace(/[\s_-]+/g, '.')
    .toLowerCase()
}

/**
 * 首字母大写
 * @param str - 输入字符串
 * @returns 首字母大写的字符串
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 首字母小写
 * @param str - 输入字符串
 * @returns 首字母小写的字符串
 */
export function uncapitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * 驼峰转下划线（别名）
 */
export const camelToSnake = toSnakeCase

/**
 * 驼峰转短横线（别名）
 */
export const camelToKebab = toKebabCase

/**
 * 下划线转驼峰（别名）
 */
export const snakeToCamel = toCamelCase

/**
 * 短横线转驼峰（别名）
 */
export const kebabToCamel = toCamelCase

/**
 * 截断字符串
 * @param str - 输入字符串
 * @param maxLength - 最大长度
 * @param suffix - 后缀（默认 '...'）
 * @returns 截断后的字符串
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str || str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * 填充字符串
 * @param str - 输入字符串
 * @param length - 目标长度
 * @param char - 填充字符
 * @param position - 填充位置
 * @returns 填充后的字符串
 */
export function pad(
  str: string,
  length: number,
  char = ' ',
  position: 'start' | 'end' | 'both' = 'end'
): string {
  if (!str) str = ''
  
  if (str.length >= length) return str
  
  const padLength = length - str.length
  
  if (position === 'start') {
    return char.repeat(padLength) + str
  } else if (position === 'end') {
    return str + char.repeat(padLength)
  } else {
    const leftPad = Math.floor(padLength / 2)
    const rightPad = padLength - leftPad
    return char.repeat(leftPad) + str + char.repeat(rightPad)
  }
}

/**
 * 移除字符串两端空白
 * @param str - 输入字符串
 * @returns 去除空白后的字符串
 */
export function trim(str: string): string {
  return str?.trim() || ''
}

/**
 * 字符串是否为空
 * @param str - 输入字符串
 * @returns 是否为空
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

/**
 * 字符串是否非空
 * @param str - 输入字符串
 * @returns 是否非空
 */
export function isNotEmpty(str: string | null | undefined): boolean {
  return !isEmpty(str)
}

/**
 * 复数化（简单版）
 * @param str - 单数形式
 * @param count - 数量
 * @returns 复数形式
 */
export function pluralize(str: string, count?: number): string {
  if (count === 1) return str
  
  // 简单的复数规则
  if (str.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(v => str.endsWith(v))) {
    return str.slice(0, -1) + 'ies'
  }
  
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
      str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es'
  }
  
  return str + 's'
}

/**
 * 单数化（简单版）
 * @param str - 复数形式
 * @returns 单数形式
 */
export function singularize(str: string): string {
  if (str.endsWith('ies')) {
    return str.slice(0, -3) + 'y'
  }
  
  if (str.endsWith('es')) {
    const base = str.slice(0, -2)
    if (base.endsWith('s') || base.endsWith('x') || base.endsWith('z') || 
        base.endsWith('ch') || base.endsWith('sh')) {
      return base
    }
    return str.slice(0, -1)
  }
  
  if (str.endsWith('s')) {
    return str.slice(0, -1)
  }
  
  return str
}

/**
 * 随机字符串
 * @param length - 长度
 * @param charset - 字符集
 * @returns 随机字符串
 */
export function randomString(
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * 转义正则表达式特殊字符
 * @param str - 输入字符串
 * @returns 转义后的字符串
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 转义 HTML 特殊字符
 * @param str - 输入字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char])
}

/**
 * 反转义 HTML
 * @param str - 输入字符串
 * @returns 反转义后的字符串
 */
export function unescapeHtml(str: string): string {
  const htmlUnescapes: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  }
  
  return str.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => htmlUnescapes[entity])
}


