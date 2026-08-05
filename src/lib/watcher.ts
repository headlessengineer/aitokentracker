import * as fs from 'fs'
import chokidar, { type FSWatcher } from 'chokidar'
import { registry } from '../plugins'

// SSE client handle — one per open browser connection.
type Controller = ReadableStreamDefaultController<Uint8Array>

// All state lives on globalThis so it survives Next.js hot reloads in dev.
const g = globalThis as typeof globalThis & {
  __aitWatcher?: FSWatcher
  __aitWatcherClients?: Set<Controller>
  __aitWatcherPathMap?: Map<string, string>  // dataPath prefix → pluginId
}

const encoder = new TextEncoder()

function clients(): Set<Controller> {
  if (!g.__aitWatcherClients) g.__aitWatcherClients = new Set()
  return g.__aitWatcherClients
}

function broadcast(pluginId: string): void {
  const msg = encoder.encode(`data: ${JSON.stringify({ pluginId })}\n\n`)
  for (const ctrl of clients()) {
    try {
      ctrl.enqueue(msg)
    } catch {
      // Client already closed — remove it
      clients().delete(ctrl)
    }
  }
}

/** Start the chokidar watcher (idempotent — safe to call on every SSE connect). */
function ensureWatcher(): void {
  if (g.__aitWatcher) return

  const pathMap = new Map<string, string>()
  const watchPaths: string[] = []

  for (const plugin of registry.getAll()) {
    if (!plugin.dataPath) continue
    // Only watch paths that currently exist; chokidar will pick up new ones via the parent
    try { fs.accessSync(plugin.dataPath) } catch { continue }
    pathMap.set(plugin.dataPath, plugin.id)
    watchPaths.push(plugin.dataPath)
  }

  g.__aitWatcherPathMap = pathMap

  if (watchPaths.length === 0) return

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    ignorePermissionErrors: true,
    // Don't watch .DS_Store or lock files
    ignored: /(^|[/\\])\..|(\.lock$)/,
  })

  watcher.on('all', (_event, filePath) => {
    const map = g.__aitWatcherPathMap
    if (!map) return
    // Find the plugin whose dataPath is a prefix of the changed file
    for (const [watchedPath, pluginId] of map) {
      if (filePath.startsWith(watchedPath)) {
        broadcast(pluginId)
        return
      }
    }
  })

  g.__aitWatcher = watcher
}

export function addClient(ctrl: Controller): void {
  ensureWatcher()
  clients().add(ctrl)
}

export function removeClient(ctrl: Controller): void {
  clients().delete(ctrl)
}
