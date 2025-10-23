/**
 * 内置模板
 */

export const VUE_COMPONENT_TEMPLATE = `<template>
  <div class="<%= kebabCase %>">
    <!-- <%= componentName %> 组件内容 -->
  </div>
</template>

<% if (withScript) { %>
<script<% if (lang === 'ts') { %> lang="ts"<% } %> setup>
import { ref } from 'vue'

<% if (props.length > 0) { %>
interface Props {
<% props.forEach(prop => { %>
  <%= prop.name %>: <%= prop.type %>
<% }) %>
}

const props = defineProps<Props>()
<% } %>

<% if (emits.length > 0) { %>
const emit = defineEmits<{
<% emits.forEach(event => { %>
  <%= event %>: []
<% }) %>
}>()
<% } %>
</script>
<% } %>

<% if (withStyle) { %>
<style scoped>
.<%= kebabCase %> {
  /* 样式 */
}
</style>
<% } %>
`

export const REACT_COMPONENT_TEMPLATE = `<% if (withTypes) { %>
interface <%= componentName %>Props {
<% props.forEach(prop => { %>
  <%= prop.name %>: <%= prop.type %>
<% }) %>
}
<% } %>

export const <%= componentName %>: React.FC<<% if (withTypes) { %><%= componentName %>Props<% } %>> = (props) => {
  return (
    <div className="<%= componentName.toLowerCase() %>">
      {/* <%= componentName %> 组件内容 */}
    </div>
  )
}
`

export const PACKAGE_JSON_TEMPLATE = `{
  "name": "<%= packageName %>",
  "version": "<%= version %>",
  "description": "<%= description %>",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "ldesign-builder build",
    "dev": "ldesign-builder build --watch"
  },
  "keywords": <%= JSON.stringify(keywords) %>,
  "author": "<%= author %>",
  "license": "MIT"
}
`


