import {defineConfig} from 'vitepress'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default defineConfig({
    title: "南武文库",
    description: "坚忍奉公 联合斗争",
    themeConfig: {
        logo: {
            src: '/icons/nambu_docs.png',
            width: 24, height: 24,
        },

        nav: [
            {text: '主页', link: '/'},
            {text: '人民文艺与档案', link: '/archives_n_arts/'},
            {text: '世界观资料库', link: '/databank/'},
        ],

        sidebar: getSideBar(),
    }
})

function getSideBar() {
    const rootDir = process.cwd()
    const excludeDirs = ['node_modules', 'dist', 'public']
    const sidebar: Record<string, any> = {}

    const entries = fs.readdirSync(rootDir, {withFileTypes: true})

    for (const entry of entries) {
        if (!entry.isDirectory() || excludeDirs.includes(entry.name) || entry.name.startsWith('.')) continue

        const channelPath = path.join(rootDir, entry.name)
        const channelKey = `/${entry.name}/`
        const indexPath = path.join(channelPath, 'index.md')

        const rootItem: any = {
            text: getTitle(indexPath) || "本版块介绍"
        }
        if (hasContent(indexPath)) rootItem.link = '/'

        sidebar[channelKey] = {
            base: channelKey,
            items: [rootItem, ...buildSidebarItems(channelPath, channelKey)]
        }
    }

    return sidebar
}

function buildSidebarItems(dirPath: string, basePath: string): any[] {
    if (!fs.existsSync(dirPath)) return []

    const items: any[] = []
    const entries = fs.readdirSync(dirPath, {withFileTypes: true})

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
            const indexPath = path.join(fullPath, 'index.md')
            const subPath = `${basePath}${entry.name}/`

            const item: any = {
                text: getTitle(indexPath) || entry.name,
                base: subPath,
                items: buildSidebarItems(fullPath, subPath)
            }
            if (hasContent(indexPath)) item.link = '/'

            items.push(item)
        } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
            const fileName = entry.name.replace(/\.md$/, '')
            items.push({
                text: getDocumentTitle(fullPath) || fileName,
                link: fileName
            })
        }
    }

    return items
}

function getTitle(filePath: string): string | null {
    try {
        if (!fs.existsSync(filePath)) return null
        const {data} = matter(fs.readFileSync(filePath, 'utf-8'))
        return data.title || null
    } catch {
        return null
    }
}

function hasContent(filePath: string): boolean {
    try {
        if (!fs.existsSync(filePath)) return false
        const {content} = matter(fs.readFileSync(filePath, 'utf-8'))
        return content.trim().length > 0
    } catch {
        return false
    }
}

function getDocumentTitle(filePath: string): string | null {
    try {
        if (!fs.existsSync(filePath)) return null

        const {data, content} = matter(fs.readFileSync(filePath, 'utf-8'))

        // 优先使用 front matter 的 title
        if (data.title) return data.title

        // 查找第一个 h1 标题或第一行非空内容
        const lines = content.split('\n')
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            // 匹配 # 开头的标题
            const h1Match = trimmed.match(/^#\s+(.+)$/)
            if (h1Match) return h1Match[1].trim()

            // 返回清理后的第一行内容
            const cleaned = trimmed
                .replace(/^#+\s*/, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/`/g, '')
                .trim()

            return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned
        }

        return null
    } catch {
        return null
    }
}