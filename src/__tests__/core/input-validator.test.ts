/**
 * 输入验证器测试
 */

import { describe, it, expect } from 'vitest'
import { InputValidator, validateComponentName, validateFilePath } from '../../core/input-validator'
import { ValidationError } from '../../core/errors'

describe('InputValidator', () => {
  describe('validateComponentName', () => {
    it('should accept valid PascalCase names', () => {
      expect(() => validateComponentName('MyButton')).not.toThrow()
      expect(() => validateComponentName('UserCard')).not.toThrow()
      expect(() => validateComponentName('HelloWorld')).not.toThrow()
    })

    it('should accept valid kebab-case names', () => {
      expect(() => validateComponentName('my-button')).not.toThrow()
      expect(() => validateComponentName('user-card')).not.toThrow()
    })

    it('should reject invalid names', () => {
      expect(() => validateComponentName('123Button')).toThrow(ValidationError)
      expect(() => validateComponentName('my_button')).toThrow(ValidationError)
      expect(() => validateComponentName('')).toThrow(ValidationError)
      expect(() => validateComponentName('a')).toThrow(ValidationError)
    })

    it('should reject names with special characters', () => {
      expect(() => validateComponentName('My@Button')).toThrow()
      expect(() => validateComponentName('My Button')).toThrow()
    })
  })

  describe('validateFilePath', () => {
    it('should accept safe paths', () => {
      expect(() => validateFilePath('components/Button.vue')).not.toThrow()
      expect(() => validateFilePath('src/pages/Home.vue')).not.toThrow()
    })

    it('should reject path traversal attempts', () => {
      expect(() => validateFilePath('../../../etc/passwd')).toThrow(ValidationError)
      expect(() => validateFilePath('../../file.txt')).toThrow(ValidationError)
    })

    it('should reject empty paths', () => {
      expect(() => validateFilePath('')).toThrow(ValidationError)
    })
  })

  describe('validateTemplateName', () => {
    it('should validate template names', () => {
      const result1 = InputValidator.validateTemplateName('vue/component.ejs')
      expect(result1.valid).toBe(true)

      const result2 = InputValidator.validateTemplateName('')
      expect(result2.valid).toBe(false)
      expect(result2.errors.length).toBeGreaterThan(0)
    })

    it('should reject template names with path separators', () => {
      const result = InputValidator.validateTemplateName('../template.ejs')
      expect(result.valid).toBe(false)
    })

    it('should reject too long names', () => {
      const longName = 'a'.repeat(300)
      const result = InputValidator.validateTemplateName(longName)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateFileName', () => {
    it('should accept valid filenames', () => {
      const result = InputValidator.validateFileName('MyComponent.vue')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid filenames', () => {
      const result1 = InputValidator.validateFileName('')
      expect(result1.valid).toBe(false)

      const result2 = InputValidator.validateFileName('file<test>.txt')
      expect(result2.valid).toBe(false)

      const result3 = InputValidator.validateFileName('CON')
      expect(result3.valid).toBe(false)
    })
  })

  describe('validateProps', () => {
    it('should validate valid props', () => {
      const result = InputValidator.validateProps([
        { name: 'type', type: 'string', default: 'primary' },
        { name: 'size', type: 'number' }
      ])
      expect(result.valid).toBe(true)
    })

    it('should reject props with missing name', () => {
      const result = InputValidator.validateProps([
        { name: '', type: 'string' } as any
      ])
      expect(result.valid).toBe(false)
    })

    it('should reject props with invalid naming', () => {
      const result = InputValidator.validateProps([
        { name: 'MyProp', type: 'string' } // Should be camelCase
      ])
      expect(result.valid).toBe(false)
    })
  })

  describe('validateEndpoint', () => {
    it('should validate valid endpoints', () => {
      const result = InputValidator.validateEndpoint({
        name: 'getList',
        method: 'GET',
        path: '/users'
      })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid HTTP methods', () => {
      const result = InputValidator.validateEndpoint({
        name: 'test',
        method: 'INVALID' as any,
        path: '/test'
      })
      expect(result.valid).toBe(false)
    })

    it('should reject paths not starting with /', () => {
      const result = InputValidator.validateEndpoint({
        name: 'test',
        method: 'GET',
        path: 'invalid'
      })
      expect(result.valid).toBe(false)
    })
  })

  describe('validation rules', () => {
    it('should validate required fields', () => {
      const rule = InputValidator.required('name')
      
      expect(rule('')).toBeTruthy()
      expect(rule(null)).toBeTruthy()
      expect(rule(undefined)).toBeTruthy()
      expect(rule('value')).toBeNull()
    })

    it('should validate min length', () => {
      const rule = InputValidator.minLength('name', 3)
      
      expect(rule('ab')).toBeTruthy()
      expect(rule('abc')).toBeNull()
      expect(rule('abcd')).toBeNull()
    })

    it('should validate max length', () => {
      const rule = InputValidator.maxLength('name', 5)
      
      expect(rule('abcdef')).toBeTruthy()
      expect(rule('abcde')).toBeNull()
      expect(rule('abc')).toBeNull()
    })

    it('should validate pattern', () => {
      const rule = InputValidator.pattern('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      
      expect(rule('test@example.com')).toBeNull()
      expect(rule('invalid')).toBeTruthy()
    })

    it('should validate oneOf', () => {
      const rule = InputValidator.oneOf('type', ['vue', 'react', 'angular'])
      
      expect(rule('vue')).toBeNull()
      expect(rule('react')).toBeNull()
      expect(rule('svelte')).toBeTruthy()
    })
  })

  describe('combine validators', () => {
    it('should combine multiple validators', () => {
      const rule = InputValidator.combine(
        InputValidator.required('name'),
        InputValidator.minLength('name', 2),
        InputValidator.maxLength('name', 10)
      )

      expect(rule('')).toBeTruthy()
      expect(rule('a')).toBeTruthy()
      expect(rule('valid')).toBeNull()
      expect(rule('verylongname')).toBeTruthy()
    })
  })

  describe('validateFields', () => {
    it('should validate multiple fields', () => {
      const result = InputValidator.validateFields(
        {
          name: 'MyButton',
          type: 'vue'
        },
        {
          name: [
            InputValidator.required('name'),
            InputValidator.minLength('name', 2)
          ],
          type: [
            InputValidator.oneOf('type', ['vue', 'react'])
          ]
        }
      )

      expect(result.valid).toBe(true)
    })

    it('should return errors for invalid fields', () => {
      const result = InputValidator.validateFields(
        {
          name: '',
          type: 'invalid'
        },
        {
          name: [InputValidator.required('name')],
          type: [InputValidator.oneOf('type', ['vue', 'react'])]
        }
      )

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('utility validators', () => {
    it('should validate URLs', () => {
      expect(InputValidator.isValidUrl('https://example.com')).toBe(true)
      expect(InputValidator.isValidUrl('http://localhost:3000')).toBe(true)
      expect(InputValidator.isValidUrl('invalid')).toBe(false)
    })

    it('should validate emails', () => {
      expect(InputValidator.isValidEmail('test@example.com')).toBe(true)
      expect(InputValidator.isValidEmail('user+tag@domain.co.uk')).toBe(true)
      expect(InputValidator.isValidEmail('invalid')).toBe(false)
      expect(InputValidator.isValidEmail('@example.com')).toBe(false)
    })

    it('should validate semantic versions', () => {
      expect(InputValidator.isValidSemanticVersion('1.0.0')).toBe(true)
      expect(InputValidator.isValidSemanticVersion('2.1.3')).toBe(true)
      expect(InputValidator.isValidSemanticVersion('1.0.0-alpha')).toBe(true)
      expect(InputValidator.isValidSemanticVersion('1.0.0-beta.1')).toBe(true)
      expect(InputValidator.isValidSemanticVersion('1.0')).toBe(false)
      expect(InputValidator.isValidSemanticVersion('v1.0.0')).toBe(false)
    })
  })
})

