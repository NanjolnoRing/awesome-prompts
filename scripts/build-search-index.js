const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const CONTENT_PATH = path.join(process.cwd(), 'content', 'prompts')
const OUT_PATH = path.join(process.cwd(), 'public', 'search-index.json')

if (!fs.existsSync(CONTENT_PATH)) {
  console.error('content/prompts 目录不存在，跳过生成索引。')
  process.exit(1)
}

const files = fs.readdirSync(CONTENT_PATH).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
const index = files.map(filename => {
  const raw = fs.readFileSync(path.join(CONTENT_PATH, filename), 'utf-8')
  const { data, content } = matter(raw)
  return {
    title: data.title || filename.replace(/\.mdx?$/, ''),
    tags: data.tags || [],
    model: data.model || '',
    date: data.date || '',
    slug: filename.replace(/\.mdx?$/, ''),
    excerpt: (content || '').replace(/
+/g, ' ').slice(0, 300)
  }
})

if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.mkdirSync(path.join(process.cwd(), 'public'))
}

fs.writeFileSync(OUT_PATH, JSON.stringify(index, null, 2))
console.log(`生成索引：${OUT_PATH} （共 ${index.length} 条）`)