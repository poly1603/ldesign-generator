/**
 * 字符串工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  toConstantCase,
  toTitleCase,
  capitalize,
  uncapitalize,
  truncate,
  pad,
  isEmpty,
  isNotEmpty,
  pluralize,
  singularize,
  escapeHtml,
  unescapeHtml
} from '../../utils/string-helpers'

describe('String Helpers', () => {
  describe('toCamelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld')
      expect(toCamelCase('my-component-name')).toBe('myComponentName')
    })

    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld')
      expect(toCamelCase('my_component_name')).toBe('myComponentName')
    })

    it('should convert PascalCase to camelCase', () => {
      expect(toCamelCase('HelloWorld')).toBe('helloWorld')
      expect(toCamelCase('MyComponentName')).toBe('myComponentName')
    })

    it('should handle spaces', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld')
    })

    it('should handle empty string', () => {
      expect(toCamelCase('')).toBe('')
    })
  })

  describe('toPascalCase', () => {
    it('should convert camelCase to PascalCase', () => {
      expect(toPascalCase('helloWorld')).toBe('HelloWorld')
    })

    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld')
      expect(toPascalCase('my-component')).toBe('MyComponent')
    })

    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('hello_world')).toBe('HelloWorld')
    })

    it('should handle spaces', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld')
    })
  })

  describe('toKebabCase', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('HelloWorld')).toBe('hello-world')
      expect(toKebabCase('MyComponent')).toBe('my-component')
    })

    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world')
    })

    it('should handle spaces and underscores', () => {
      expect(toKebabCase('hello world')).toBe('hello-world')
      expect(toKebabCase('hello_world')).toBe('hello-world')
    })

    it('should handle already kebab-case', () => {
      expect(toKebabCase('hello-world')).toBe('hello-world')
    })
  })

  describe('toSnakeCase', () => {
    it('should convert PascalCase to snake_case', () => {
      expect(toSnakeCase('HelloWorld')).toBe('hello_world')
    })

    it('should convert camelCase to snake_case', () => {
      expect(toSnakeCase('helloWorld')).toBe('hello_world')
    })

    it('should convert kebab-case to snake_case', () => {
      expect(toSnakeCase('hello-world')).toBe('hello_world')
    })

    it('should handle spaces', () => {
      expect(toSnakeCase('hello world')).toBe('hello_world')
    })
  })

  describe('toConstantCase', () => {
    it('should convert to CONSTANT_CASE', () => {
      expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD')
      expect(toConstantCase('HelloWorld')).toBe('HELLO_WORLD')
      expect(toConstantCase('hello-world')).toBe('HELLO_WORLD')
    })
  })

  describe('toTitleCase', () => {
    it('should convert to Title Case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
      expect(toTitleCase('hello-world')).toBe('Hello-world')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
    })

    it('should handle single character', () => {
      expect(capitalize('h')).toBe('H')
    })

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('uncapitalize', () => {
    it('should uncapitalize first letter', () => {
      expect(uncapitalize('Hello')).toBe('hello')
      expect(uncapitalize('World')).toBe('world')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...')
      expect(truncate('hello world', 5)).toBe('he...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })

    it('should use custom suffix', () => {
      expect(truncate('hello world', 8, '---')).toBe('hello---')
    })
  })

  describe('pad', () => {
    it('should pad end by default', () => {
      expect(pad('hello', 10)).toBe('hello     ')
    })

    it('should pad start', () => {
      expect(pad('hello', 10, ' ', 'start')).toBe('     hello')
    })

    it('should pad both sides', () => {
      expect(pad('hello', 11, ' ', 'both')).toBe('   hello   ')
    })

    it('should use custom padding character', () => {
      expect(pad('hello', 10, '-')).toBe('hello-----')
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty strings', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false)
      expect(isEmpty(' hello ')).toBe(false)
    })
  })

  describe('isNotEmpty', () => {
    it('should be opposite of isEmpty', () => {
      expect(isNotEmpty('hello')).toBe(true)
      expect(isNotEmpty('')).toBe(false)
    })
  })

  describe('pluralize', () => {
    it('should handle regular plurals', () => {
      expect(pluralize('user')).toBe('users')
      expect(pluralize('item')).toBe('items')
    })

    it('should handle -y ending', () => {
      expect(pluralize('category')).toBe('categories')
      expect(pluralize('city')).toBe('cities')
    })

    it('should handle -s, -x, -z endings', () => {
      expect(pluralize('class')).toBe('classes')
      expect(pluralize('box')).toBe('boxes')
    })

    it('should handle count parameter', () => {
      expect(pluralize('user', 1)).toBe('user')
      expect(pluralize('user', 2)).toBe('users')
    })

    it('should not pluralize -ay, -ey, etc', () => {
      expect(pluralize('day')).toBe('days')
      expect(pluralize('key')).toBe('keys')
    })
  })

  describe('singularize', () => {
    it('should singularize regular plurals', () => {
      expect(singularize('users')).toBe('user')
      expect(singularize('items')).toBe('item')
    })

    it('should handle -ies ending', () => {
      expect(singularize('categories')).toBe('category')
      expect(singularize('cities')).toBe('city')
    })

    it('should handle -es ending', () => {
      expect(singularize('classes')).toBe('class')
      expect(singularize('boxes')).toBe('box')
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
      expect(escapeHtml('&')).toBe('&amp;')
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;')
      expect(escapeHtml("'test'")).toBe('&#39;test&#39;')
    })

    it('should escape multiple characters', () => {
      expect(escapeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;')
    })
  })

  describe('unescapeHtml', () => {
    it('should unescape HTML entities', () => {
      expect(unescapeHtml('&lt;div&gt;')).toBe('<div>')
      expect(unescapeHtml('&amp;')).toBe('&')
      expect(unescapeHtml('&quot;test&quot;')).toBe('"test"')
    })

    it('should handle multiple entities', () => {
      expect(unescapeHtml('&lt;div class=&quot;test&quot;&gt;')).toBe('<div class="test">')
    })
  })
})

