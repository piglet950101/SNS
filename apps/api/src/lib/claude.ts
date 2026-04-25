import Anthropic from '@anthropic-ai/sdk'
import { buildXUserPrompt, scanForbidden, X_SYSTEM_PROMPT, buildRetryPrompt } from '@postari/prompts'
import { env } from '../env'
import { logger } from './logger'

const e = env()
const anthropic = new Anthropic({ apiKey: e.ANTHROPIC_API_KEY })

export interface GenerateXInput {
  store: { name: string; businessType: string; area: string }
  hint?: string
  imageUrls: string[]
}

export interface GenerateXResult {
  text: string
  retried: boolean
  violations: string[]
}

/**
 * Generate an X (Twitter) post. If the model's first pass violates 景表法,
 * retry once with a stricter prompt; if still violating, surface the
 * violations so the caller can decide (throw / return fallback / ask user).
 */
export async function generateXPost(input: GenerateXInput): Promise<GenerateXResult> {
  const userText = buildXUserPrompt({
    store: input.store,
    hint: input.hint,
    imageCount: input.imageUrls.length,
  })

  // SDK 0.30 type defs don't include URL image sources or cache_control on
  // text blocks (they're behind beta headers). Cast to bypass — runtime API
  // accepts them per Anthropic docs.
  const imageBlocks = input.imageUrls.map((url) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  })) as unknown as Anthropic.ImageBlockParam[]

  const firstPass = await anthropic.messages.create({
    model: e.ANTHROPIC_MODEL,
    max_tokens: 500,
    system: [
      { type: 'text', text: X_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } } as Anthropic.TextBlockParam,
    ],
    messages: [
      {
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: userText }],
      },
    ],
  })

  const firstText = extractText(firstPass)
  const firstCheck = scanForbidden(firstText)

  if (firstCheck.passed) {
    return { text: firstText.trim(), retried: false, violations: [] }
  }

  logger.warn({ violations: firstCheck.violations }, 'Claude output tripped 景表法 — retrying')

  const retry = await anthropic.messages.create({
    model: e.ANTHROPIC_MODEL,
    max_tokens: 500,
    system: [
      { type: 'text', text: X_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } } as Anthropic.TextBlockParam,
    ],
    messages: [
      { role: 'user', content: [...imageBlocks, { type: 'text', text: userText }] },
      { role: 'assistant', content: [{ type: 'text', text: firstText }] },
      { role: 'user', content: [{ type: 'text', text: buildRetryPrompt(firstCheck.violations) }] },
    ],
  })

  const retryText = extractText(retry)
  const retryCheck = scanForbidden(retryText)
  return {
    text: retryText.trim(),
    retried: true,
    violations: retryCheck.passed ? [] : retryCheck.violations,
  }
}

function extractText(resp: Anthropic.Message): string {
  const parts = resp.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
  return parts.map((p) => p.text).join('\n')
}
