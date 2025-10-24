import { Generator } from './generator'
import type { ComponentOptions, HookOptions, StoreOptions } from '../types'

/**
 * 组件生成器 - 专门用于生成 Vue/React 组件及相关代码
 */
export class ComponentGenerator {
  private generator: Generator

  constructor(templateDir: string, outputDir: string) {
    this.generator = new Generator({ templateDir, outputDir })
  }

  /**
   * 生成 Vue 组件
   */
  async generateVueComponent(options: ComponentOptions) {
    const data = {
      componentName: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      props: options.props || [],
      emits: options.emits || [],
      withScript: options.withScript !== false,
      withStyle: options.withStyle !== false,
      withTypes: options.withTypes !== false,
      withTest: options.withTest || false,
      lang: options.lang || 'ts',
      styleType: options.styleType || 'css',
      description: options.description,
      outputFileName: `${options.name}.vue`
    }

    return await this.generator.generate('vue/component.ejs', data)
  }

  /**
   * 生成 Vue TSX 组件
   */
  async generateVueTsxComponent(options: ComponentOptions) {
    const data = {
      componentName: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      props: options.props || [],
      emits: options.emits || [],
      withStyle: options.withStyle !== false,
      styleType: options.styleType || 'css',
      description: options.description,
      outputFileName: `${this.toPascalCase(options.name)}.tsx`
    }

    return await this.generator.generate('vue/component-tsx.ejs', data)
  }

  /**
   * 生成 Vue Composable
   */
  async generateVueComposable(options: HookOptions) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      params: options.params || [],
      returns: options.returns,
      async: options.async || false,
      lang: 'ts',
      description: options.description,
      outputFileName: `use${this.toPascalCase(options.name)}.ts`
    }

    return await this.generator.generate('vue/composable.ejs', data)
  }

  /**
   * 生成 Vue Store (Pinia)
   */
  async generateVueStore(options: StoreOptions) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      type: 'pinia',
      state: options.state || [],
      actions: options.actions || [],
      withTypes: options.withTypes !== false,
      withPersist: options.withPersist || false,
      lang: 'ts',
      description: options.description,
      outputFileName: `${this.toKebabCase(options.name)}.ts`
    }

    return await this.generator.generate('vue/store.ejs', data)
  }

  /**
   * 生成 Vue 指令
   */
  async generateVueDirective(options: { name: string; description?: string }) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      lang: 'ts',
      description: options.description,
      outputFileName: `v${this.toPascalCase(options.name)}.ts`
    }

    return await this.generator.generate('vue/directive.ejs', data)
  }

  /**
   * 生成 Vue 插件
   */
  async generateVuePlugin(options: { name: string; description?: string }) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      lang: 'ts',
      description: options.description,
      outputFileName: `${this.toKebabCase(options.name)}.plugin.ts`
    }

    return await this.generator.generate('vue/plugin.ejs', data)
  }

  /**
   * 生成 React 组件
   */
  async generateReactComponent(options: ComponentOptions) {
    const data = {
      componentName: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      props: options.props || [],
      withTypes: options.withTypes !== false,
      withStyle: options.withStyle !== false,
      styleType: options.styleType || 'css',
      lang: options.lang || 'tsx',
      description: options.description,
      outputFileName: `${this.toPascalCase(options.name)}.${options.lang || 'tsx'}`
    }

    return await this.generator.generate('react/component.ejs', data)
  }

  /**
   * 生成 React 类组件
   */
  async generateReactClassComponent(options: ComponentOptions) {
    const data = {
      componentName: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      props: options.props || [],
      withStyle: options.withStyle !== false,
      styleType: options.styleType || 'css',
      lang: options.lang || 'tsx',
      description: options.description,
      outputFileName: `${this.toPascalCase(options.name)}.${options.lang || 'tsx'}`
    }

    return await this.generator.generate('react/component-class.ejs', data)
  }

  /**
   * 生成 React Hook
   */
  async generateReactHook(options: HookOptions) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      params: options.params || [],
      returns: options.returns,
      async: options.async || false,
      lang: 'tsx',
      description: options.description,
      outputFileName: `use${this.toPascalCase(options.name)}.ts`
    }

    return await this.generator.generate('react/hook.ejs', data)
  }

  /**
   * 生成 React Context
   */
  async generateReactContext(options: { name: string; async?: boolean; description?: string }) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      async: options.async || false,
      lang: 'tsx',
      description: options.description,
      outputFileName: `${this.toPascalCase(options.name)}Context.tsx`
    }

    return await this.generator.generate('react/context.ejs', data)
  }

  /**
   * 生成 React HOC
   */
  async generateReactHOC(options: { name: string; description?: string }) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      lang: 'tsx',
      description: options.description,
      outputFileName: `with${this.toPascalCase(options.name)}.tsx`
    }

    return await this.generator.generate('react/hoc.ejs', data)
  }

  /**
   * 生成 React Store
   */
  async generateReactStore(options: StoreOptions) {
    const data = {
      name: options.name,
      pascalCase: this.toPascalCase(options.name),
      camelCase: this.toCamelCase(options.name),
      kebabCase: this.toKebabCase(options.name),
      type: options.type,
      state: options.state || [],
      actions: options.actions || [],
      withTypes: options.withTypes !== false,
      withPersist: options.withPersist || false,
      lang: 'tsx',
      description: options.description,
      outputFileName: `${this.toKebabCase(options.name)}.${options.type === 'redux' ? 'slice' : 'store'}.ts`
    }

    return await this.generator.generate('react/store.ejs', data)
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase())
  }

  /**
   * 转换为 camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toLowerCase())
  }

  /**
   * 转换为 kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }
}


