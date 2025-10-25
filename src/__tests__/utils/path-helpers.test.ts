/**
 * 路径工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  normalizePath,
  isPathSafe,
  isValidFileName,
  sanitizeFileName,
  getExtension,
  getBaseName,
  replaceExtension,
  cleanPath
} from '../../utils/path-helpers'

describe('Path Helpers', () => {
  describe('normalizePath', () => {
    it('should normalize path separators', () => {
      expect(normalizePath('path\\to\\file')).toBe('path/to/file')
      expect(normalizePath('path/to/file')).toBe('path/to/file')
    })

    it('should normalize relative paths', () => {
      expect(normalizePath('./path/to/file')).toContain('path/to/file')
    })
  })

  describe('isPathSafe', () => {
    it('should allow safe paths', () => {
      expect(isPathSafe('components/Button.vue')).toBe(true)
      expect(isPathSafe('src/pages/Home.vue')).toBe(true)
      expect(isPathSafe('file.txt')).toBe(true)
    })

    it('should reject path traversal attempts', () => {
      expect(isPathSafe('../../../etc/passwd')).toBe(false)
      expect(isPathSafe('../../file.txt')).toBe(false)
    })

    it('should reject absolute paths in relative context', () => {
      expect(isPathSafe('/etc/passwd')).toBe(false)
      expect(isPathSafe('C:\\Windows\\System32')).toBe(false)
    })

    it('should reject paths with dangerous characters', () => {
      expect(isPathSafe('file<test>.txt')).toBe(false)
      expect(isPathSafe('file|test.txt')).toBe(false)
      expect(isPathSafe('file?test.txt')).toBe(false)
    })
  })

  describe('isValidFileName', () => {
    it('should allow valid filenames', () => {
      expect(isValidFileName('file.txt')).toBe(true)
      expect(isValidFileName('MyComponent.vue')).toBe(true)
      expect(isValidFileName('test-file.js')).toBe(true)
    })

    it('should reject invalid filenames', () => {
      expect(isValidFileName('')).toBe(false)
      expect(isValidFileName('file<test>.txt')).toBe(false)
      expect(isValidFileName('file|test.txt')).toBe(false)
    })

    it('should reject Windows reserved names', () => {
      expect(isValidFileName('CON')).toBe(false)
      expect(isValidFileName('PRN')).toBe(false)
      expect(isValidFileName('AUX')).toBe(false)
      expect(isValidFileName('NUL')).toBe(false)
      expect(isValidFileName('COM1')).toBe(false)
    })

    it('should reject filenames ending with dot or space', () => {
      expect(isValidFileName('file.')).toBe(false)
      expect(isValidFileName('file ')).toBe(false)
    })
  })

  describe('sanitizeFileName', () => {
    it('should remove invalid characters', () => {
      expect(sanitizeFileName('file<test>.txt')).toBe('file_test_.txt')
      expect(sanitizeFileName('file|test:name.txt')).toBe('file_test_name.txt')
    })

    it('should remove leading/trailing dots and spaces', () => {
      expect(sanitizeFileName('..file.txt')).toBe('file.txt')
      expect(sanitizeFileName('file.txt ')).toBe('file.txt')
    })

    it('should use custom replacement', () => {
      expect(sanitizeFileName('file:test.txt', '-')).toBe('file-test.txt')
    })
  })

  describe('getExtension', () => {
    it('should get file extension', () => {
      expect(getExtension('file.txt')).toBe('txt')
      expect(getExtension('file.vue')).toBe('vue')
      expect(getExtension('file.spec.ts')).toBe('ts')
    })

    it('should handle no extension', () => {
      expect(getExtension('file')).toBe('')
    })

    it('should handle multiple dots', () => {
      expect(getExtension('file.min.js')).toBe('js')
    })
  })

  describe('getBaseName', () => {
    it('should get filename without extension', () => {
      expect(getBaseName('file.txt')).toBe('file')
      expect(getBaseName('MyComponent.vue')).toBe('MyComponent')
    })

    it('should handle no extension', () => {
      expect(getBaseName('file')).toBe('file')
    })

    it('should handle paths', () => {
      expect(getBaseName('path/to/file.txt')).toBe('file')
    })
  })

  describe('replaceExtension', () => {
    it('should replace extension', () => {
      expect(replaceExtension('file.txt', 'md')).toContain('file.md')
      expect(replaceExtension('file.js', '.ts')).toContain('file.ts')
    })

    it('should handle paths', () => {
      const result = replaceExtension('path/to/file.txt', 'md')
      expect(result).toContain('path')
      expect(result).toContain('file.md')
    })
  })

  describe('cleanPath', () => {
    it('should clean redundant separators', () => {
      expect(cleanPath('path//to///file.txt')).toBe('path/to/file.txt')
    })

    it('should remove leading ./', () => {
      expect(cleanPath('./path/to/file.txt')).toBe('path/to/file.txt')
    })
  })
})

