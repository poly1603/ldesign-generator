/**
 * 缓存管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager, createCacheManager } from '../../core/cache-manager'

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    cacheManager = createCacheManager({
      templateCacheSize: 10,
      compiledTemplateCacheSize: 10,
      enabled: true
    })
  })

  describe('template cache', () => {
    it('should cache and retrieve templates', () => {
      const key = 'test-template'
      const content = '<div>Test</div>'

      cacheManager.setTemplate(key, content)
      const cached = cacheManager.getTemplate(key)

      expect(cached).toBe(content)
    })

    it('should return null for non-existent keys', () => {
      const result = cacheManager.getTemplate('non-existent')
      expect(result).toBeNull()
    })

    it('should track hit and miss', () => {
      cacheManager.setTemplate('key1', 'content')

      // Hit
      cacheManager.getTemplate('key1')

      // Miss
      cacheManager.getTemplate('key2')

      const stats = cacheManager.getStats()
      expect(stats.hitCount).toBeGreaterThan(0)
      expect(stats.missCount).toBeGreaterThan(0)
    })
  })

  describe('compiled template cache', () => {
    it('should cache compiled templates', () => {
      const key = 'compiled-template'
      const template = () => 'result'

      cacheManager.setCompiledTemplate(key, template)
      const cached = cacheManager.getCompiledTemplate(key)

      expect(cached).toBe(template)
    })
  })

  describe('invalidate', () => {
    it('should invalidate specific template', () => {
      cacheManager.setTemplate('key1', 'content1')
      cacheManager.setTemplate('key2', 'content2')

      cacheManager.invalidate('template', 'key1')

      expect(cacheManager.getTemplate('key1')).toBeNull()
      expect(cacheManager.getTemplate('key2')).toBe('content2')
    })

    it('should invalidate all templates', () => {
      cacheManager.setTemplate('key1', 'content1')
      cacheManager.setTemplate('key2', 'content2')

      cacheManager.invalidate('template')

      expect(cacheManager.getTemplate('key1')).toBeNull()
      expect(cacheManager.getTemplate('key2')).toBeNull()
    })

    it('should clear all caches', () => {
      cacheManager.setTemplate('key1', 'content')
      cacheManager.setCompiledTemplate('key2', () => 'result')

      cacheManager.clearAll()

      expect(cacheManager.getTemplate('key1')).toBeNull()
      expect(cacheManager.getCompiledTemplate('key2')).toBeNull()
    })
  })

  describe('stats', () => {
    it('should calculate hit rate', () => {
      cacheManager.setTemplate('key', 'content')

      // 2 hits
      cacheManager.getTemplate('key')
      cacheManager.getTemplate('key')

      // 1 miss
      cacheManager.getTemplate('non-existent')

      const stats = cacheManager.getStats()

      expect(stats.hitCount).toBe(2)
      expect(stats.missCount).toBe(1)
      expect(stats.hitRate).toBe('66.67%')
    })
  })

  describe('enable/disable', () => {
    it('should respect enabled flag', () => {
      cacheManager.setEnabled(false)

      cacheManager.setTemplate('key', 'content')
      const result = cacheManager.getTemplate('key')

      expect(result).toBeNull()
    })
  })

  describe('warmup', () => {
    it('should warmup cache with templates', async () => {
      await cacheManager.warmup([
        { key: 'template1', content: 'content1' },
        { key: 'template2', content: 'content2' }
      ])

      expect(cacheManager.getTemplate('template1')).toBe('content1')
      expect(cacheManager.getTemplate('template2')).toBe('content2')
    })
  })
})

