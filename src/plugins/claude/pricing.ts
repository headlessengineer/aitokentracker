// Estimated Claude model pricing, used to compute cost from token usage.
//
// Claude Code JSONL entries do NOT record a billed cost, so cost is derived
// here from `usage` tokens x per-model rates. This is an ESTIMATE: rates are
// keyed by model *family* at current published prices, so older model versions
// and any future price changes are approximated rather than exact.
//
// Rates are USD per million tokens. Cache multipliers follow Anthropic's
// standard pricing: cache write (5m) = 1.25x input, cache write (1h) = 2x
// input, cache read = 0.1x input.

interface Rate {
  input: number
  output: number
  cacheWrite5m: number
  cacheWrite1h: number
  cacheRead: number
}

type Family = 'opus' | 'sonnet' | 'haiku'

const PER_MILLION: Record<Family, Rate> = {
  opus:   { input: 5, output: 25, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheRead: 0.5 },
  sonnet: { input: 3, output: 15, cacheWrite5m: 3.75, cacheWrite1h: 6,  cacheRead: 0.3 },
  haiku:  { input: 1, output: 5,  cacheWrite5m: 1.25, cacheWrite1h: 2,  cacheRead: 0.1 },
}

export interface UsageForCost {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  cache_creation?: {
    ephemeral_5m_input_tokens?: number
    ephemeral_1h_input_tokens?: number
  }
}

function rateForModel(model: string): Rate | null {
  const m = model.toLowerCase()
  if (m.includes('opus')) return PER_MILLION.opus
  if (m.includes('haiku')) return PER_MILLION.haiku
  if (m.includes('sonnet')) return PER_MILLION.sonnet
  return null
}

/** Estimated USD cost for a single usage record. Returns 0 for unknown models. */
export function costForUsage(model: string, usage: UsageForCost): number {
  const rate = rateForModel(model)
  if (!rate) return 0

  const input = usage.input_tokens ?? 0
  const output = usage.output_tokens ?? 0
  const cacheRead = usage.cache_read_input_tokens ?? 0

  // Prefer the 5m/1h breakdown when present; otherwise treat all cache
  // creation as 5-minute (Claude Code's default cache TTL).
  const detail = usage.cache_creation
  let write5m = 0
  let write1h = 0
  if (detail && ((detail.ephemeral_5m_input_tokens ?? 0) > 0 || (detail.ephemeral_1h_input_tokens ?? 0) > 0)) {
    write5m = detail.ephemeral_5m_input_tokens ?? 0
    write1h = detail.ephemeral_1h_input_tokens ?? 0
  } else {
    write5m = usage.cache_creation_input_tokens ?? 0
  }

  const cost =
    input * rate.input +
    output * rate.output +
    cacheRead * rate.cacheRead +
    write5m * rate.cacheWrite5m +
    write1h * rate.cacheWrite1h

  return cost / 1_000_000
}
