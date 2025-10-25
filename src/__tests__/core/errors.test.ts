/**
 * 错误处理系统测试
 */

import { describe, it, expect } from 'vitest'
import {
  GeneratorError,
  TemplateError,
  FileSystemError,
  ValidationError,
  ErrorFactory,
  ErrorHandler
} from '../../core/errors'
import { ErrorCode, ErrorSeverity } from '../../types/errors'

describe('Error System', () => {
  describe('GeneratorError', () => {
    it('should create error with message', () => {
      const error = new GeneratorError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('GeneratorError')
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should create error with metadata', () => {
      const error = new GeneratorError('Test error', {
        code: ErrorCode.TEMPLATE_NOT_FOUND,
        severity: ErrorSeverity.HIGH,
        context: { template: 'test.ejs' },
        suggestion: 'Check template path'
      })

      expect(error.code).toBe(ErrorCode.TEMPLATE_NOT_FOUND)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.context).toEqual({ template: 'test.ejs' })
      expect(error.suggestion).toBe('Check template path')
    })

    it('should have timestamp', () => {
      const before = new Date()
      const error = new GeneratorError('Test')
      const after = new Date()

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should format to object', () => {
      const error = new GeneratorError('Test', {
        code: ErrorCode.FILE_NOT_FOUND,
        context: { file: 'test.txt' }
      })

      const formatted = error.toFormatted()

      expect(formatted.message).toBe('Test')
      expect(formatted.code).toBe(ErrorCode.FILE_NOT_FOUND)
      expect(formatted.context).toEqual({ file: 'test.txt' })
    })

    it('should convert to JSON', () => {
      const error = new GeneratorError('Test')
      const json = error.toJSON()

      expect(json).toHaveProperty('name')
      expect(json).toHaveProperty('code')
      expect(json).toHaveProperty('message')
      expect(json).toHaveProperty('timestamp')
    })
  })

  describe('TemplateError', () => {
    it('should be instance of GeneratorError', () => {
      const error = new TemplateError('Template error')
      
      expect(error).toBeInstanceOf(GeneratorError)
      expect(error).toBeInstanceOf(TemplateError)
      expect(error.name).toBe('TemplateError')
    })

    it('should have correct default severity', () => {
      const error = new TemplateError('Test')
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })
  })

  describe('FileSystemError', () => {
    it('should store file path', () => {
      const error = new FileSystemError('Error', '/path/to/file')
      
      expect(error.filePath).toBe('/path/to/file')
      expect(error.context?.filePath).toBe('/path/to/file')
    })
  })

  describe('ValidationError', () => {
    it('should store validation errors', () => {
      const validationErrors = [
        { field: 'name', message: 'Required' },
        { field: 'type', message: 'Invalid' }
      ]

      const error = new ValidationError('Validation failed', validationErrors)

      expect(error.validationErrors).toEqual(validationErrors)
      expect(error.context?.validationErrors).toEqual(validationErrors)
    })
  })

  describe('ErrorFactory', () => {
    describe('templateNotFound', () => {
      it('should create template not found error', () => {
        const error = ErrorFactory.templateNotFound('test.ejs')

        expect(error).toBeInstanceOf(TemplateError)
        expect(error.code).toBe(ErrorCode.TEMPLATE_NOT_FOUND)
        expect(error.message).toContain('test.ejs')
        expect(error.suggestion).toBeTruthy()
      })
    })

    describe('templateSyntaxError', () => {
      it('should create template syntax error', () => {
        const cause = new Error('Syntax error')
        const error = ErrorFactory.templateSyntaxError('test.ejs', cause)

        expect(error).toBeInstanceOf(TemplateError)
        expect(error.code).toBe(ErrorCode.TEMPLATE_SYNTAX_ERROR)
        expect(error.cause).toBe(cause)
      })
    })

    describe('fileNotFound', () => {
      it('should create file not found error', () => {
        const error = ErrorFactory.fileNotFound('/path/to/file')

        expect(error).toBeInstanceOf(FileSystemError)
        expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND)
        expect(error.filePath).toBe('/path/to/file')
      })
    })

    describe('fileAlreadyExists', () => {
      it('should create file exists error', () => {
        const error = ErrorFactory.fileAlreadyExists('/path/to/file')

        expect(error).toBeInstanceOf(FileSystemError)
        expect(error.code).toBe(ErrorCode.FILE_ALREADY_EXISTS)
        expect(error.suggestion).toContain('force')
      })
    })

    describe('pathTraversalAttempt', () => {
      it('should create path traversal error', () => {
        const error = ErrorFactory.pathTraversalAttempt('../../../etc')

        expect(error).toBeInstanceOf(FileSystemError)
        expect(error.code).toBe(ErrorCode.PATH_TRAVERSAL_ATTEMPT)
        expect(error.severity).toBe(ErrorSeverity.CRITICAL)
      })
    })

    describe('validationError', () => {
      it('should create validation error', () => {
        const errors = [
          { field: 'name', message: 'Required' }
        ]
        const error = ErrorFactory.validationError('Invalid input', errors)

        expect(error).toBeInstanceOf(ValidationError)
        expect(error.validationErrors).toEqual(errors)
      })
    })

    describe('wrapError', () => {
      it('should wrap GeneratorError as is', () => {
        const original = new TemplateError('Test')
        const wrapped = ErrorFactory.wrapError(original)

        expect(wrapped).toBe(original)
      })

      it('should wrap standard Error', () => {
        const original = new Error('Test error')
        const wrapped = ErrorFactory.wrapError(original)

        expect(wrapped).toBeInstanceOf(GeneratorError)
        expect(wrapped.message).toBe('Test error')
        expect(wrapped.cause).toBe(original)
      })

      it('should wrap non-Error values', () => {
        const wrapped = ErrorFactory.wrapError('String error')

        expect(wrapped).toBeInstanceOf(GeneratorError)
        expect(wrapped.message).toBe('String error')
      })
    })
  })

  describe('ErrorHandler', () => {
    describe('handle', () => {
      it('should handle and format errors', () => {
        const error = new TemplateError('Test')
        const formatted = ErrorHandler.handle(error)

        expect(formatted.message).toBe('Test')
        expect(formatted.code).toBe(ErrorCode.TEMPLATE_RENDER_ERROR)
      })

      it('should wrap non-GeneratorError', () => {
        const error = new Error('Standard error')
        const formatted = ErrorHandler.handle(error)

        expect(formatted.code).toBe(ErrorCode.UNKNOWN_ERROR)
      })
    })

    describe('isRecoverable', () => {
      it('should identify recoverable errors', () => {
        const recoverable = new GeneratorError('Test', {
          severity: ErrorSeverity.LOW
        })
        expect(ErrorHandler.isRecoverable(recoverable)).toBe(true)

        const critical = new GeneratorError('Test', {
          severity: ErrorSeverity.CRITICAL
        })
        expect(ErrorHandler.isRecoverable(critical)).toBe(false)
      })
    })

    describe('getUserMessage', () => {
      it('should format user-friendly message', () => {
        const error = new GeneratorError('Error occurred', {
          suggestion: 'Try this',
          documentationUrl: 'https://docs.example.com'
        })

        const message = ErrorHandler.getUserMessage(error)

        expect(message).toContain('Error occurred')
        expect(message).toContain('Try this')
        expect(message).toContain('https://docs.example.com')
      })
    })
  })
})

