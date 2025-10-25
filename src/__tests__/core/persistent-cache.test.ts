/**
 * 持久化缓存测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPersistentCache } from '../../core/persistent-cache'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

describe('PersistentCache', () => {
  const testCacheDir = path.join(os.tmpdir(), 'ldesign-test-cache')
  let cache: ReturnType<typeof createPersistentCache>

  beforeEach(async () => {
    await fs.ensureDir(testCacheDir)
    cache = createPersistentCache('test', {
      cacheDir: testCacheDir,
      enabled: true,
      ttl: 60000 // 1 minute
    })
  })

  afterEach(async () => {
    cache.destroy()
    await fs.remove(testCacheDir)
  })

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await cache.set('key1', { data: 'value1' })
      const value = await cache.get('key1')

      expect(value).toEqual({ data: 'value1' })
    })

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('non-existent')
      expect(value).toBeNull()
    })

    it('should handle different data types', async () => {
      await cache.set('string', 'test')
      await cache.set('number', 123)
      await cache.set('object', { a: 1, b: 2 })
      await cache.set('array', [1, 2, 3])

      expect(await cache.get('string')).toBe('test')
      expect(await cache.get('number')).toBe(123)
      expect(await cache.get('object')).toEqual({ a: 1, b: 2 })
      expect(await cache.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('delete', () => {
    it('should delete entries', async () => {
      await cache.set('key1', 'value1')

      const deleted = await cache.delete('key1')
      expect(deleted).toBe(true)

      const value = await cache.get('key1')
      expect(value).toBeNull()
    })

    it('should return false for non-existent keys', async () => {
      const deleted = await cache.delete('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all entries', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await cache.clear()

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
    })
  })

  describe('stats', () => {
    it('should provide statistics', async () => {
      await cache.set('key1', 'small')
      await cache.set('key2', { large: 'data'.repeat(1000) })

      const stats = cache.getStats()

      expect(stats.entries).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.enabled).toBe(true)
    })
  })

  describe('export and import', () => {
    it('should export cache', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', { data: 'value2' })

      const exportPath = path.join(testCacheDir, 'export.json')
      await cache.export(exportPath)

      const exported = await fs.readJSON(exportPath)
      expect(exported.entries).toHaveLength(2)
    })

    it('should import cache', async () => {
      const importPath = path.join(testCacheDir, 'import.json')
      await fs.writeJSON(importPath, {
        timestamp: new Date().toISOString(),
        entries: [
          { key: 'imported1', value: 'value1', timestamp: new Date().toISOString(), size: 100 },
          { key: 'imported2', value: { data: 'value2' }, timestamp: new Date().toISOString(), size: 200 }
        ]
      })

      await cache.import(importPath)

      expect(await cache.get('imported1')).toBe('value1')
      expect(await cache.get('imported2')).toEqual({ data: 'value2' })
    })
  })
})

