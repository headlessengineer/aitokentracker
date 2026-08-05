import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { DatabaseSync } from 'node:sqlite'
import type { PluginData } from '../plugins/core/types'

const CACHE_DB_PATH = path.join(os.homedir(), '.config', 'aitokentracker', 'cache.db')

// ISO 8601 datetime pattern — used to rehydrate Date objects after JSON.parse.
// Matches "2024-01-15T10:30:00.000Z" but NOT "2024-01-15" (date-only strings like
// DailyActivity.date and DailyCost.date, which must remain plain strings).
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATETIME_RE.test(value)) return new Date(value)
  return value
}

// Singleton DB — survives Next.js hot reloads in dev via globalThis
const g = globalThis as typeof globalThis & { __aitCacheDb?: DatabaseSync }

function getDb(): DatabaseSync {
  if (g.__aitCacheDb) return g.__aitCacheDb
  const dir = path.dirname(CACHE_DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const db = new DatabaseSync(CACHE_DB_PATH)
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_cache (
      pluginId    TEXT    NOT NULL,
      days        INTEGER NOT NULL,
      collectedAt INTEGER NOT NULL,
      data        TEXT    NOT NULL,
      PRIMARY KEY (pluginId, days)
    )
  `)
  g.__aitCacheDb = db
  return db
}

/**
 * Walk `dir` recursively and return the highest mtime seen, in ms.
 * Stops after visiting `cap` filesystem entries to bound cost on large trees.
 */
function maxMtimeMs(dir: string, cap = 2000): number {
  let max = 0
  let count = 0

  function walk(p: string): void {
    if (count >= cap) return
    let stat: fs.Stats
    try {
      stat = fs.statSync(p)
    } catch {
      return
    }
    count++
    if (stat.mtimeMs > max) max = stat.mtimeMs
    if (!stat.isDirectory()) return
    let entries: string[]
    try {
      entries = fs.readdirSync(p)
    } catch {
      return
    }
    for (const entry of entries) {
      walk(path.join(p, entry))
    }
  }

  walk(dir)
  return max
}

/**
 * Return cached PluginData for (pluginId, days) if still valid.
 * Invalid when: no entry exists, or any file under dataPath is newer than collectedAt.
 */
export function getCached(pluginId: string, days: number, dataPath: string): PluginData | null {
  if (!dataPath) return null
  try {
    const row = getDb()
      .prepare('SELECT collectedAt, data FROM plugin_cache WHERE pluginId = ? AND days = ?')
      .get(pluginId, days) as { collectedAt: number; data: string } | undefined

    if (!row) return null

    const srcMtime = maxMtimeMs(dataPath)
    if (srcMtime > row.collectedAt) return null

    return JSON.parse(row.data, dateReviver) as PluginData
  } catch {
    return null
  }
}

/** Write (or replace) a cache entry for (pluginId, days). */
export function setCached(pluginId: string, days: number, data: PluginData): void {
  try {
    getDb()
      .prepare(
        'INSERT OR REPLACE INTO plugin_cache (pluginId, days, collectedAt, data) VALUES (?, ?, ?, ?)'
      )
      .run(pluginId, days, Date.now(), JSON.stringify(data))
  } catch {
    // Cache write failures are non-fatal
  }
}

/** Delete cache entries. Omit pluginId to clear all entries. */
export function clearCache(pluginId?: string): void {
  try {
    if (pluginId) {
      getDb().prepare('DELETE FROM plugin_cache WHERE pluginId = ?').run(pluginId)
    } else {
      getDb().exec('DELETE FROM plugin_cache')
    }
  } catch {
    // Ignore
  }
}
