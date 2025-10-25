/**
 * 路径处理辅助工具
 * 提供安全的路径操作功能
 */

import path from 'path'
import fs from 'fs-extra'

/**
 * 规范化路径
 * @param filePath - 文件路径
 * @returns 规范化后的路径
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/')
}

/**
 * 安全地连接路径（防止路径遍历攻击）
 * @param basePath - 基础路径
 * @param targetPath - 目标路径
 * @returns 安全的完整路径
 * @throws {Error} 如果目标路径试图逃逸基础路径
 */
export function safeJoinPath(basePath: string, targetPath: string): string {
  const normalizedBase = path.resolve(basePath)
  const joinedPath = path.resolve(normalizedBase, targetPath)
  
  // 检查结果路径是否在基础路径内
  if (!joinedPath.startsWith(normalizedBase)) {
    throw new Error(`路径遍历攻击检测: ${targetPath} 试图逃逸基础路径 ${basePath}`)
  }
  
  return joinedPath
}

/**
 * 检查路径是否安全（不包含危险字符）
 * @param filePath - 文件路径
 * @returns 是否安全
 */
export function isPathSafe(filePath: string): boolean {
  // 检查是否包含路径遍历尝试
  if (filePath.includes('..')) return false
  
  // 检查是否包含绝对路径标记（在非绝对路径场景）
  if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) return false
  
  // 检查是否包含特殊字符
  const dangerousChars = /[<>:"|?*\x00-\x1f]/
  if (dangerousChars.test(filePath)) return false
  
  return true
}

/**
 * 验证路径是否在允许的目录内
 * @param filePath - 文件路径
 * @param allowedDir - 允许的目录
 * @returns 是否在允许目录内
 */
export function isPathInDirectory(filePath: string, allowedDir: string): boolean {
  const resolvedPath = path.resolve(filePath)
  const resolvedDir = path.resolve(allowedDir)
  
  return resolvedPath.startsWith(resolvedDir)
}

/**
 * 获取相对路径
 * @param from - 起始路径
 * @param to - 目标路径
 * @returns 相对路径
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to).replace(/\\/g, '/')
}

/**
 * 获取文件扩展名（不含点）
 * @param filePath - 文件路径
 * @returns 扩展名
 */
export function getExtension(filePath: string): string {
  const ext = path.extname(filePath)
  return ext.startsWith('.') ? ext.slice(1) : ext
}

/**
 * 获取文件名（不含扩展名）
 * @param filePath - 文件路径
 * @returns 文件名
 */
export function getBaseName(filePath: string): string {
  const fullName = path.basename(filePath)
  const ext = path.extname(fullName)
  return ext ? fullName.slice(0, -ext.length) : fullName
}

/**
 * 替换文件扩展名
 * @param filePath - 文件路径
 * @param newExt - 新扩展名（可以带或不带点）
 * @returns 新的文件路径
 */
export function replaceExtension(filePath: string, newExt: string): string {
  const dir = path.dirname(filePath)
  const baseName = getBaseName(filePath)
  const ext = newExt.startsWith('.') ? newExt : `.${newExt}`
  
  return path.join(dir, baseName + ext)
}

/**
 * 确保路径存在（创建目录）
 * @param dirPath - 目录路径
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath)
}

/**
 * 检查路径是否存在
 * @param filePath - 文件路径
 * @returns 是否存在
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return await fs.pathExists(filePath)
}

/**
 * 检查路径是否为目录
 * @param filePath - 文件路径
 * @returns 是否为目录
 */
export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * 检查路径是否为文件
 * @param filePath - 文件路径
 * @returns 是否为文件
 */
export async function isFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath)
    return stats.isFile()
  } catch {
    return false
  }
}

/**
 * 获取文件大小
 * @param filePath - 文件路径
 * @returns 文件大小（字节）
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch {
    return 0
  }
}

/**
 * 生成唯一文件名（如果文件已存在）
 * @param filePath - 文件路径
 * @returns 唯一的文件路径
 */
export async function generateUniqueFileName(filePath: string): Promise<string> {
  if (!(await pathExists(filePath))) {
    return filePath
  }
  
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const baseName = getBaseName(filePath)
  
  let counter = 1
  let newPath: string
  
  do {
    newPath = path.join(dir, `${baseName}-${counter}${ext}`)
    counter++
  } while (await pathExists(newPath))
  
  return newPath
}

/**
 * 清理路径（移除多余的分隔符等）
 * @param filePath - 文件路径
 * @returns 清理后的路径
 */
export function cleanPath(filePath: string): string {
  return normalizePath(filePath)
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '')
}

/**
 * 检查文件名是否合法
 * @param fileName - 文件名
 * @returns 是否合法
 */
export function isValidFileName(fileName: string): boolean {
  // Windows 和 Unix 通用的非法字符
  const invalidChars = /[<>:"|?*\x00-\x1f]/
  
  // Windows 保留名称
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i
  
  if (!fileName || fileName.length === 0) return false
  if (invalidChars.test(fileName)) return false
  if (reservedNames.test(fileName)) return false
  if (fileName.endsWith('.') || fileName.endsWith(' ')) return false
  
  return true
}

/**
 * 清理文件名（移除非法字符）
 * @param fileName - 文件名
 * @param replacement - 替换字符
 * @returns 清理后的文件名
 */
export function sanitizeFileName(fileName: string, replacement = '_'): string {
  return fileName
    .replace(/[<>:"|?*\x00-\x1f]/g, replacement)
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .replace(/\s+$/, '')
}

/**
 * 获取临时文件路径
 * @param prefix - 前缀
 * @param extension - 扩展名
 * @returns 临时文件路径
 */
export function getTempFilePath(prefix = 'temp', extension = '.tmp'): string {
  const tmpDir = require('os').tmpdir()
  const randomSuffix = Math.random().toString(36).substring(7)
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  
  return path.join(tmpDir, `${prefix}-${randomSuffix}${ext}`)
}

/**
 * 将路径转换为 URL 格式
 * @param filePath - 文件路径
 * @returns URL 格式的路径
 */
export function pathToUrl(filePath: string): string {
  return normalizePath(filePath).replace(/ /g, '%20')
}

/**
 * 获取文件的 MIME 类型（简单版）
 * @param filePath - 文件路径
 * @returns MIME 类型
 */
export function getMimeType(filePath: string): string {
  const ext = getExtension(filePath).toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    // 文本
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'md': 'text/markdown',
    
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // 视频
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    
    // 音频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    
    // 其他
    'pdf': 'application/pdf',
    'zip': 'application/zip'
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * 比较两个路径是否指向同一位置
 * @param path1 - 路径1
 * @param path2 - 路径2
 * @returns 是否相同
 */
export function isSamePath(path1: string, path2: string): boolean {
  return path.resolve(path1) === path.resolve(path2)
}

/**
 * 获取路径深度
 * @param filePath - 文件路径
 * @returns 深度
 */
export function getPathDepth(filePath: string): number {
  return normalizePath(filePath).split('/').filter(Boolean).length
}


