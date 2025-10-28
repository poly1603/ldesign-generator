import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/generator',
  description: '功能强大的企业级前端代码生成工具',
  lang: 'zh-CN',
  base: '/generator/',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'API', link: '/api/overview' },
      { text: '示例', link: '/examples/basic' },
      { text: '更新日志', link: '/changelog' },
      {
        text: 'v2.0.0',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: 'v1.x 文档', link: 'https://v1.generator.ldesign.dev' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '配置', link: '/guide/configuration' }
          ]
        },
        {
          text: '核心概念',
          collapsed: false,
          items: [
            { text: '生成器', link: '/guide/generators' },
            { text: '模板引擎', link: '/guide/templates' },
            { text: '插件系统', link: '/guide/plugins' },
            { text: '配置系统', link: '/guide/config' }
          ]
        },
        {
          text: 'CLI 命令',
          collapsed: false,
          items: [
            { text: 'CLI 概述', link: '/guide/cli/overview' },
            { text: '组件生成', link: '/guide/cli/component' },
            { text: '页面生成', link: '/guide/cli/page' },
            { text: '批量生成', link: '/guide/cli/batch' },
            { text: '历史回滚', link: '/guide/cli/history' }
          ]
        },
        {
          text: '高级功能',
          collapsed: false,
          items: [
            { text: '日志系统', link: '/guide/advanced/logger' },
            { text: '缓存系统', link: '/guide/advanced/cache' },
            { text: '性能监控', link: '/guide/advanced/performance' },
            { text: '模板验证', link: '/guide/advanced/validation' },
            { text: '历史管理', link: '/guide/advanced/history' },
            { text: '回滚功能', link: '/guide/advanced/rollback' }
          ]
        },
        {
          text: '最佳实践',
          collapsed: false,
          items: [
            { text: '开发规范', link: '/guide/best-practices/development' },
            { text: '团队协作', link: '/guide/best-practices/team' },
            { text: '性能优化', link: '/guide/best-practices/performance' },
            { text: '故障排除', link: '/guide/best-practices/troubleshooting' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概述', link: '/api/overview' },
            { text: 'Generator', link: '/api/generator' },
            { text: 'ComponentGenerator', link: '/api/component-generator' },
            { text: 'PageGenerator', link: '/api/page-generator' },
            { text: 'ApiGenerator', link: '/api/api-generator' },
            { text: 'BatchGenerator', link: '/api/batch-generator' }
          ]
        },
        {
          text: '高级 API',
          items: [
            { text: 'TemplateEngine', link: '/api/template-engine' },
            { text: 'PluginSystem', link: '/api/plugin-system' },
            { text: 'CacheManager', link: '/api/cache-manager' },
            { text: 'PerformanceMonitor', link: '/api/performance-monitor' },
            { text: 'HistoryManager', link: '/api/history-manager' },
            { text: 'RollbackManager', link: '/api/rollback-manager' }
          ]
        },
        {
          text: '插件 API',
          items: [
            { text: '插件开发', link: '/api/plugin-development' },
            { text: '内置插件', link: '/api/built-in-plugins' }
          ]
        },
        {
          text: '类型定义',
          items: [
            { text: '类型总览', link: '/api/types' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '基础示例',
          items: [
            { text: '基础用法', link: '/examples/basic' },
            { text: 'Vue 组件', link: '/examples/vue' },
            { text: 'React 组件', link: '/examples/react' },
            { text: 'Angular 组件', link: '/examples/angular' }
          ]
        },
        {
          text: '高级示例',
          items: [
            { text: '批量生成', link: '/examples/batch' },
            { text: '自定义插件', link: '/examples/custom-plugin' },
            { text: '完整工作流', link: '/examples/workflow' },
            { text: 'CRUD 系统', link: '/examples/crud' }
          ]
        },
        {
          text: '实战案例',
          items: [
            { text: '团队协作', link: '/examples/team-collaboration' },
            { text: '性能优化', link: '/examples/performance-optimization' },
            { text: 'CI/CD 集成', link: '/examples/ci-cd' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/generator' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present LDesign Team'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    editLink: {
      pattern: 'https://github.com/ldesign/generator/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  }
})
