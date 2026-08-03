import fs from 'fs'
import path from 'path'
import os from 'os'

export interface ContentItem {
  type: 'text' | 'tool_use' | 'tool_result' | 'image'
  text?: string
  name?: string
  id?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: unknown
}

export interface ClaudeJournalEntry {
  type: 'user' | 'assistant' | 'summary'
  timestamp?: string
  sessionId?: string
  cwd?: string
  message?: {
    id?: string
    role?: string
    model?: string
    content?: string | ContentItem[]
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
      cache_creation?: {
        ephemeral_5m_input_tokens?: number
        ephemeral_1h_input_tokens?: number
      }
    }
  }
  isSidechain?: boolean
}

export interface HookDefinition {
  event: string
  matcher?: string
  type: 'command' | 'agent'
  approxCallCount: number
}

export interface ParsedConversation {
  id: string
  filePath: string
  project: string
  entries: ClaudeJournalEntry[]
  lastModified: Date
  created: Date
}

function resolveClaudeProjectsDir(): string {
  return path.join(os.homedir(), '.claude', 'projects')
}

function extractProjectFromCwd(cwd: string): string {
  const parts = cwd.split(path.sep).filter(Boolean)
  return parts[parts.length - 1] ?? cwd
}

function decodeProjectDir(dirName: string): string {
  try {
    const decoded = dirName.replace(/-/g, '/').replace(/^\//, '')
    const parts = decoded.split('/').filter(Boolean)
    return parts[parts.length - 1] ?? dirName
  } catch {
    return dirName
  }
}

function readJsonlFile(filePath: string): ClaudeJournalEntry[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        try {
          return JSON.parse(line) as ClaudeJournalEntry
        } catch {
          return null
        }
      })
      .filter((e): e is ClaudeJournalEntry => e !== null)
  } catch {
    return []
  }
}

function getProjectFromEntries(entries: ClaudeJournalEntry[], fallback: string): string {
  for (const entry of entries) {
    if (entry.cwd) return extractProjectFromCwd(entry.cwd)
  }
  return fallback
}

export function collectConversations(): ParsedConversation[] {
  const projectsDir = resolveClaudeProjectsDir()
  if (!fs.existsSync(projectsDir)) return []

  const conversations: ParsedConversation[] = []

  for (const projectDir of fs.readdirSync(projectsDir, { withFileTypes: true })) {
    if (!projectDir.isDirectory()) continue
    const projectPath = path.join(projectsDir, projectDir.name)
    const fallback = decodeProjectDir(projectDir.name)

    let files: fs.Dirent[]
    try {
      files = fs.readdirSync(projectPath, { withFileTypes: true })
        .filter((f) => f.isFile() && f.name.endsWith('.jsonl'))
    } catch {
      continue
    }

    for (const jsonlFile of files) {
      const filePath = path.join(projectPath, jsonlFile.name)
      let stat: fs.Stats
      try { stat = fs.statSync(filePath) } catch { continue }

      const entries = readJsonlFile(filePath)
      if (entries.length === 0) continue

      conversations.push({
        id: jsonlFile.name.replace('.jsonl', ''),
        filePath,
        project: getProjectFromEntries(entries, fallback),
        entries,
        lastModified: stat.mtime,
        created: stat.birthtime,
      })
    }

    // Also traverse subagent subdirectories (e.g. <conv-id>/subagents/*.jsonl)
    for (const subDir of fs.readdirSync(projectPath, { withFileTypes: true })) {
      if (!subDir.isDirectory()) continue
      const subPath = path.join(projectPath, subDir.name, 'subagents')
      if (!fs.existsSync(subPath)) continue

      let subFiles: fs.Dirent[]
      try {
        subFiles = fs.readdirSync(subPath, { withFileTypes: true })
          .filter((f) => f.isFile() && f.name.endsWith('.jsonl'))
      } catch {
        continue
      }

      for (const jsonlFile of subFiles) {
        const filePath = path.join(subPath, jsonlFile.name)
        let stat: fs.Stats
        try { stat = fs.statSync(filePath) } catch { continue }

        const entries = readJsonlFile(filePath)
        if (entries.length === 0) continue

        conversations.push({
          id: jsonlFile.name.replace('.jsonl', ''),
          filePath,
          project: getProjectFromEntries(entries, fallback),
          entries,
          lastModified: stat.mtime,
          created: stat.birthtime,
        })
      }
    }
  }

  return conversations
}

interface SettingsHook {
  type?: string
  command?: string
  prompt?: string
  timeout?: number
}

interface SettingsHookEntry {
  matcher?: string
  hooks?: SettingsHook[]
}

interface ClaudeSettings {
  hooks?: Record<string, SettingsHookEntry[]>
}

function readSettings(filePath: string): ClaudeSettings {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as ClaudeSettings
  } catch {
    return {}
  }
}

export function collectHookDefinitions(toolCallCounts: Record<string, number>): HookDefinition[] {
  const settingsPaths = [
    path.join(os.homedir(), '.claude', 'settings.json'),
    path.join(os.homedir(), '.claude', 'settings.local.json'),
  ]

  const defs: HookDefinition[] = []

  for (const p of settingsPaths) {
    if (!fs.existsSync(p)) continue
    const settings = readSettings(p)
    if (!settings.hooks) continue

    for (const [event, entries] of Object.entries(settings.hooks)) {
      for (const entry of entries) {
        if (!entry.hooks) continue
        for (const hook of entry.hooks) {
          const type = hook.type === 'agent' ? 'agent' : 'command'

          // Approximate call count from tool usage
          let approxCount = 0
          if (entry.matcher) {
            const patterns = entry.matcher.split('|')
            for (const [toolName, count] of Object.entries(toolCallCounts)) {
              if (patterns.some((p) => toolName.includes(p))) {
                approxCount += count
              }
            }
          } else {
            // No matcher = fires on all events
            approxCount = Object.values(toolCallCounts).reduce((a, b) => a + b, 0)
          }

          defs.push({ event, matcher: entry.matcher, type, approxCallCount: approxCount })
        }
      }
    }
  }

  return defs
}
