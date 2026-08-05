import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface ModelRate {
  inputPer1M: number
  outputPer1M: number
  cacheReadPer1M: number
  cacheWritePer1M: number
}

// Bundled fallback rates — pattern-matched against model strings (first match wins).
// Rates are USD per million tokens, sourced from published pricing as of 2026-08.
// Order matters: more-specific patterns must come before broader ones.
const BUNDLED_RATES: Array<[RegExp, ModelRate]> = [
  // ── Claude 5 ───────────────────────────────────────────────────────────────
  [/claude-(opus-5|fable-5)/i,          { inputPer1M: 5,     outputPer1M: 25,   cacheReadPer1M: 0.5,   cacheWritePer1M: 6.25  }],
  [/claude-sonnet-4/i,                  { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.3,   cacheWritePer1M: 3.75  }],
  [/claude-haiku-4/i,                   { inputPer1M: 0.8,   outputPer1M: 4,    cacheReadPer1M: 0.08,  cacheWritePer1M: 1     }],
  // ── Claude 3.x ────────────────────────────────────────────────────────────
  [/claude-3[-.]?5-sonnet/i,            { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.3,   cacheWritePer1M: 3.75  }],
  [/claude-3[-.]?5-haiku/i,             { inputPer1M: 0.8,   outputPer1M: 4,    cacheReadPer1M: 0.08,  cacheWritePer1M: 1     }],
  [/claude-3-opus/i,                    { inputPer1M: 15,    outputPer1M: 75,   cacheReadPer1M: 1.5,   cacheWritePer1M: 18.75 }],
  [/claude-3-sonnet/i,                  { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.3,   cacheWritePer1M: 3.75  }],
  [/claude-3-haiku/i,                   { inputPer1M: 0.25,  outputPer1M: 1.25, cacheReadPer1M: 0.03,  cacheWritePer1M: 0.3   }],
  // ── Claude generic family fallback ────────────────────────────────────────
  [/claude.*opus/i,                     { inputPer1M: 5,     outputPer1M: 25,   cacheReadPer1M: 0.5,   cacheWritePer1M: 6.25  }],
  [/claude.*sonnet/i,                   { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.3,   cacheWritePer1M: 3.75  }],
  [/claude.*haiku/i,                    { inputPer1M: 0.8,   outputPer1M: 4,    cacheReadPer1M: 0.08,  cacheWritePer1M: 1     }],
  // ── OpenAI ────────────────────────────────────────────────────────────────
  [/gpt-4\.5/i,                         { inputPer1M: 75,    outputPer1M: 150,  cacheReadPer1M: 37.5,  cacheWritePer1M: 0     }],
  [/gpt-4o-mini/i,                      { inputPer1M: 0.15,  outputPer1M: 0.6,  cacheReadPer1M: 0.075, cacheWritePer1M: 0     }],
  [/gpt-4o/i,                           { inputPer1M: 2.5,   outputPer1M: 10,   cacheReadPer1M: 1.25,  cacheWritePer1M: 0     }],
  [/o4-mini/i,                          { inputPer1M: 1.1,   outputPer1M: 4.4,  cacheReadPer1M: 0.275, cacheWritePer1M: 0     }],
  [/o3-mini/i,                          { inputPer1M: 1.1,   outputPer1M: 4.4,  cacheReadPer1M: 0.275, cacheWritePer1M: 0     }],
  [/\bo3\b/i,                           { inputPer1M: 2,     outputPer1M: 8,    cacheReadPer1M: 0.5,   cacheWritePer1M: 0     }],
  [/o1-mini/i,                          { inputPer1M: 1.1,   outputPer1M: 4.4,  cacheReadPer1M: 0.55,  cacheWritePer1M: 0     }],
  [/\bo1\b/i,                           { inputPer1M: 15,    outputPer1M: 60,   cacheReadPer1M: 7.5,   cacheWritePer1M: 0     }],
  [/codex-mini/i,                       { inputPer1M: 1.5,   outputPer1M: 6,    cacheReadPer1M: 0.375, cacheWritePer1M: 0     }],
  // ── Google Gemini ─────────────────────────────────────────────────────────
  [/gemini-2\.5-pro/i,                  { inputPer1M: 1.25,  outputPer1M: 10,   cacheReadPer1M: 0.31,  cacheWritePer1M: 4.5   }],
  [/gemini-2\.5-flash/i,                { inputPer1M: 0.3,   outputPer1M: 1,    cacheReadPer1M: 0.075, cacheWritePer1M: 1.1   }],
  [/gemini-2\.0-flash/i,                { inputPer1M: 0.1,   outputPer1M: 0.4,  cacheReadPer1M: 0.025, cacheWritePer1M: 0     }],
  [/gemini-1\.5-pro/i,                  { inputPer1M: 3.5,   outputPer1M: 10.5, cacheReadPer1M: 0.875, cacheWritePer1M: 0     }],
  [/gemini-1\.5-flash/i,                { inputPer1M: 0.075, outputPer1M: 0.3,  cacheReadPer1M: 0.019, cacheWritePer1M: 0     }],
  [/gemini/i,                           { inputPer1M: 1.25,  outputPer1M: 10,   cacheReadPer1M: 0.31,  cacheWritePer1M: 4.5   }],
  // ── xAI Grok ──────────────────────────────────────────────────────────────
  [/grok-4/i,                           { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.75,  cacheWritePer1M: 0     }],
  [/grok-3-mini/i,                      { inputPer1M: 0.3,   outputPer1M: 0.5,  cacheReadPer1M: 0.075, cacheWritePer1M: 0     }],
  [/grok-3/i,                           { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.75,  cacheWritePer1M: 0     }],
  [/grok-2/i,                           { inputPer1M: 2,     outputPer1M: 10,   cacheReadPer1M: 0.5,   cacheWritePer1M: 0     }],
  [/grok/i,                             { inputPer1M: 3,     outputPer1M: 15,   cacheReadPer1M: 0.75,  cacheWritePer1M: 0     }],
  // ── Kimi / Moonshot ───────────────────────────────────────────────────────
  [/kimi-k2/i,                          { inputPer1M: 0.14,  outputPer1M: 2.37, cacheReadPer1M: 0.035, cacheWritePer1M: 0     }],
  [/moonshot|kimi/i,                    { inputPer1M: 1.5,   outputPer1M: 2,    cacheReadPer1M: 0.15,  cacheWritePer1M: 0     }],
  // ── Alibaba Qwen ──────────────────────────────────────────────────────────
  [/qwen3/i,                            { inputPer1M: 0.6,   outputPer1M: 2.4,  cacheReadPer1M: 0,     cacheWritePer1M: 0     }],
  [/qwen/i,                             { inputPer1M: 0.5,   outputPer1M: 1.5,  cacheReadPer1M: 0,     cacheWritePer1M: 0     }],
  // ── DeepSeek ──────────────────────────────────────────────────────────────
  [/deepseek-r[12]/i,                   { inputPer1M: 0.55,  outputPer1M: 2.19, cacheReadPer1M: 0.055, cacheWritePer1M: 0     }],
  [/deepseek/i,                         { inputPer1M: 0.27,  outputPer1M: 1.1,  cacheReadPer1M: 0.027, cacheWritePer1M: 0     }],
]

// User-overridable exact-name pricing (written by refreshPricing).
// Loaded once per process; null means "not yet attempted".
let exactRates: Map<string, ModelRate> | null = null
let exactRatesLoaded = false

const USER_PRICING_PATH = path.join(os.homedir(), '.config', 'aitokentracker', 'pricing.json')

function loadExactRates(): Map<string, ModelRate> {
  if (exactRatesLoaded) return exactRates ?? new Map()
  exactRatesLoaded = true
  try {
    if (fs.existsSync(USER_PRICING_PATH)) {
      const raw = fs.readFileSync(USER_PRICING_PATH, 'utf-8')
      const parsed = JSON.parse(raw) as Record<string, ModelRate>
      exactRates = new Map(Object.entries(parsed))
    }
  } catch {
    // Silently fall through to bundled rates
  }
  return exactRates ?? new Map()
}

function rateForModel(model: string): ModelRate | null {
  if (!model) return null
  const m = model.toLowerCase()

  // Exact match first (from user's refreshed pricing file)
  const exact = loadExactRates().get(m) ?? loadExactRates().get(model)
  if (exact) return exact

  // Pattern scan through bundled rates (first match wins)
  for (const [pattern, rate] of BUNDLED_RATES) {
    if (pattern.test(model)) return rate
  }
  return null
}

/** Estimated USD cost from token counts for a given model. Returns 0 for unrecognised models. */
export function getCostUSD(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
): number {
  const rate = rateForModel(model)
  if (!rate) return 0
  return (
    inputTokens      * rate.inputPer1M +
    outputTokens     * rate.outputPer1M +
    cacheReadTokens  * rate.cacheReadPer1M +
    cacheWriteTokens * rate.cacheWritePer1M
  ) / 1_000_000
}

/**
 * Fire-and-forget background refresh of the user's pricing file from LiteLLM.
 * Skips if the existing file is less than 24 hours old.
 * Called once on first use; failures are silently swallowed.
 */
export function refreshPricing(): void {
  try {
    if (fs.existsSync(USER_PRICING_PATH)) {
      const age = Date.now() - fs.statSync(USER_PRICING_PATH).mtimeMs
      if (age < 24 * 60 * 60 * 1000) return
    }
  } catch {
    // proceed
  }
  void doRefresh()
}

async function doRefresh(): Promise<void> {
  const URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return
    const raw = await res.json() as Record<string, Record<string, number | undefined>>
    const out: Record<string, ModelRate> = {}
    for (const [model, info] of Object.entries(raw)) {
      if (!info.input_cost_per_token && !info.output_cost_per_token) continue
      out[model.toLowerCase()] = {
        inputPer1M:      (info.input_cost_per_token                ?? 0) * 1_000_000,
        outputPer1M:     (info.output_cost_per_token               ?? 0) * 1_000_000,
        cacheReadPer1M:  (info.cache_read_input_token_cost         ?? 0) * 1_000_000,
        cacheWritePer1M: (info.cache_creation_input_token_cost     ?? 0) * 1_000_000,
      }
    }
    const dir = path.dirname(USER_PRICING_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(USER_PRICING_PATH, JSON.stringify(out, null, 2), 'utf-8')
    // Bust in-memory cache so next request picks up the refreshed data
    exactRates = null
    exactRatesLoaded = false
  } catch {
    // Network or parse failure — bundled rates remain active
  }
}
