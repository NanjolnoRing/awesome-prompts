import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'

const CONTENT_PATH = path.join(process.cwd(), 'content', 'prompts')

export type PromptMeta = {
  title: string
  date?: string
  tags?: string[]
  model?: string
  license?: string
  slug: string
  rawPrompt?: string
}

export async function getAllPrompts(): Promise<PromptMeta[]> {
  if (!fs.existsSync(CONTENT_PATH)) return []
  const files = fs.readdirSync(CONTENT_PATH)
  const prompts = files
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(filename => {
      const raw = fs.readFileSync(path.join(CONTENT_PATH, filename), 'utf-8')
      const { data, content } = matter(raw)
      const slug = filename.replace(/\.mdx?$/, '')
      const meta: PromptMeta = {
        title: data.title || slug,
        date: data.date || '',
        tags: data.tags || [],
        model: data.model || '',
        license: data.license || '',
        slug,
        rawPrompt: data.rawPrompt || extractRawPromptFromContent(content)
      }
      return meta
    })
  prompts.sort((a,b) => (b.date || '').localeCompare(a.date || ''))
  return prompts
}

export async function getPromptBySlug(slug: string) {
  const fullPath = path.join(CONTENT_PATH, `${slug}.mdx`)
  const source = fs.readFileSync(fullPath, 'utf-8')
  const { content, data } = matter(source)
  const mdxSource = await serialize(content, { scope: data })
  const meta: PromptMeta = {
    title: data.title || slug,
    date: data.date || '',
    tags: data.tags || [],
    model: data.model || '',
    license: data.license || '',
    slug,
    rawPrompt: data.rawPrompt || extractRawPromptFromContent(content)
  }
  return { mdxSource, meta }
}

// 简单从正文里抽取 raw prompt（若 frontmatter 有 rawPrompt 则优先）
function extractRawPromptFromContent(content: string) {
  // 尝试匹配 **English:** 或 **中文:** 段落
  const enMatch = content.match(/\*\*English:\*\*([\s\S]*?)(
\*\*|$)/i)
  if (enMatch) return enMatch[1].trim()
  const zhMatch = content.match(/\*\*中文:\*\*([\s\S]*?)(
\*\*|$)/i)
  if (zhMatch) return zhMatch[1].trim()
  // 否则返回开头 300 字符
  return content.slice(0, 500).replace(/
+/g, ' ')
}