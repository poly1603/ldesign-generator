export interface GeneratorOptions {
  templateDir: string
  outputDir: string
}

export interface GenerateResult {
  success: boolean
  outputPath?: string
  error?: string
  message: string
}

export interface ComponentOptions {
  name: string
  props?: Array<{ name: string; type: string }>
  emits?: string[]
  withScript?: boolean
  withStyle?: boolean
  withTypes?: boolean
  lang?: 'ts' | 'js' | 'tsx' | 'jsx'
}

export interface TemplateData {
  [key: string]: any
}


