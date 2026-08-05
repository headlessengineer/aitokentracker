import { addClient, removeClient } from '@/lib/watcher'

export const dynamic = 'force-dynamic'
// Explicitly opt in to the Node.js runtime so chokidar (a Node.js lib) is available.
export const runtime = 'nodejs'

const encoder = new TextEncoder()

export async function GET(request: Request): Promise<Response> {
  let ctrl: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      ctrl = controller

      // Send an initial ping so the client knows the connection is alive
      controller.enqueue(encoder.encode(': connected\n\n'))

      addClient(ctrl)

      // Heartbeat every 25s — prevents proxies from closing idle connections
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25_000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        removeClient(ctrl)
        try { ctrl.close() } catch {}
      })
    },
    cancel() {
      removeClient(ctrl)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',   // prevent nginx from buffering the stream
    },
  })
}
