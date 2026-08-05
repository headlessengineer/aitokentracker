'use client'
import { useRef, useEffect, useState } from 'react'
import styles from './PluginBanner.module.css'

/**
 * Explicit split table for every known plugin.
 *
 * Rule for future plugins:
 *   - Single, semantically-simple word (Kiro, Goose, Zed …) → omit from table → full accent color
 *   - Compound word or multi-word name → add entry: [head, tail] (no spaces, uppercase)
 *     The banner renders HEAD in --fg and TAIL in --primary, run together without a gap.
 *
 * Fallback (when a new plugin is not in the table):
 *   - Has spaces  → first word | joined rest
 *   - CamelCase   → split at the second capital letter
 *   - Otherwise   → full accent (single word)
 */
const SPLITS: Record<string, readonly [string, string]> = {
  'Antigravity':      ['ANTI',      'GRAVITY'],
  'Claude Code':      ['CLAUDE',    'CODE'],
  'CodeBuddy':        ['CODE',      'BUDDY'],
  'Codebuff':         ['CODE',      'BUFF'],
  'Command Code':     ['COMMAND',   'CODE'],
  'GitHub Copilot':   ['GITHUB',    'COPILOT'],
  'Gemini CLI':       ['GEMINI',    'CLI'],
  'Grok Build':       ['GROK',      'BUILD'],
  'JCode':            ['J',         'CODE'],
  'Kilo Code':        ['KILO',      'CODE'],
  'MiMo Code':        ['MIMO',      'CODE'],
  'OpenAI Codex':     ['OPENAI',    'CODEX'],
  'OpenClaw':         ['OPEN',      'CLAW'],
  'OpenCode':         ['OPEN',      'CODE'],
  'OpenCode Review':  ['OPENCODE',  'REVIEW'],
  'Qwen CLI':         ['QWEN',      'CLI'],
  'Roo Code':         ['ROO',       'CODE'],
  'Windsurf':         ['WIND',      'SURF'],
  'ZCode':            ['Z',         'CODE'],
}

function resolveSplit(name: string): readonly [string, string] | null {
  if (name in SPLITS) return SPLITS[name]

  const words = name.trim().split(/\s+/)
  if (words.length > 1) {
    return [words[0].toUpperCase(), words.slice(1).join('').toUpperCase()]
  }

  // CamelCase fallback: split before the second uppercase run
  const match = name.match(/^([A-Z][a-z]+)([A-Z].*)$/)
  if (match) return [match[1].toUpperCase(), match[2].toUpperCase()]

  return null
}

const MEASURE_SIZE = 100

const REASON_HINTS: Record<string, string> = {
  path_missing: 'Install and use this tool — data will appear here automatically.',
  placeholder: 'Parser not yet implemented — check back in a future release.',
  parse_error: 'An error occurred while reading this plugin\'s data.',
  not_installed: 'This tool is not available on your machine.',
}

export function PluginBanner({ name, unavailabilityReason }: { name: string; unavailabilityReason?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)

  const split = resolveSplit(name)
  const displayText = split ? split[0] + split[1] : name.toUpperCase()

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const recalc = () => {
      const w = container.clientWidth
      const tw = measure.scrollWidth
      if (!w || !tw) return
      const ideal = Math.floor((w / tw) * MEASURE_SIZE)
      setFontSize(Math.max(24, Math.min(240, ideal)))
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(container)
    return () => ro.disconnect()
  }, [displayText])

  return (
    <div ref={containerRef} className={styles.banner}>
      {/* Hidden reference span measured at MEASURE_SIZE to derive the correct font-size */}
      <span
        ref={measureRef}
        className={styles.measure}
        style={{ fontSize: MEASURE_SIZE }}
        aria-hidden="true"
      >
        {displayText}
      </span>

      <span
        className={`${styles.text} ${fontSize !== null ? styles.visible : ''}`}
        style={fontSize !== null ? { fontSize } : undefined}
        aria-label={name}
      >
        {split ? (
          <>
            <span className={styles.head}>{split[0]}</span>
            <span className={styles.tail}>{split[1]}</span>
          </>
        ) : (
          <span className={styles.full}>{displayText}</span>
        )}
      </span>
      {unavailabilityReason && (
        <p className={styles.hint}>
          {REASON_HINTS[unavailabilityReason] ?? 'This plugin is not currently available.'}
        </p>
      )}
    </div>
  )
}
