// -----------------------------------------------------------------------------
// 景品表示法 (Act against Unjustifiable Premiums and Misleading Representations)
// guardrails — locked per 確定仕様書 v2.0 §6.
//
// We (a) inject a banned-expression constraint into the Claude system prompt
// and (b) post-filter the model output with a regex scan as a safety net.
// Preference: false positives that trigger a retry over false negatives that
// ship violations. Lawyer review is out of scope; this is risk mitigation.
// -----------------------------------------------------------------------------

/**
 * 5 categories of banned expressions from v2.0 §6.1, mapped to recommended
 * alternatives. Used verbatim in the retry prompt and for post-scan.
 */
export const GUARDRAIL_CATEGORIES = [
  {
    id: 'superlative',
    label: '最上級表現',
    banned: ['〇〇で一番', '業界最高', '日本一', 'No.1'],
    recommended: ['池袋の人気店', 'お客様に好評の', 'こだわりの'],
  },
  {
    id: 'price',
    label: '価格優位性',
    banned: ['業界最安値', '他社より安い', '最低価格'],
    recommended: ['お手頃価格', 'リーズナブルな', 'コスパ抜群の'],
  },
  {
    id: 'efficacy',
    label: '効果・効能の断定',
    banned: ['痩せる', '美白になる', '治る', '改善する'],
    recommended: ['〜を楽しめる', '〜を体験できる', '〜をサポートする'],
  },
  {
    id: 'comparison',
    label: '根拠なき比較',
    banned: ['A社より美味しい', '他店とは違う', '唯一の'],
    recommended: ['独自の', 'オリジナルの', '特製の'],
  },
  {
    id: 'absolute',
    label: '絶対的表現',
    banned: ['絶対に', '必ず', '保証する', '確実に'],
    recommended: ['きっと', 'ぜひ', 'おすすめの', '自信を持って'],
  },
] as const

/**
 * Hard-banned regex patterns. These are conservative and can over-match
 * (e.g. "必ず" alone); we accept the false positive rate to avoid shipping
 * violations. Each hit triggers a retry with `buildRetryPrompt`.
 */
export const FORBIDDEN_PATTERNS: RegExp[] = [
  // Superlatives
  /日本一/u,
  /世界一/u,
  /最高級/u,
  /業界(?:最|一|No\.?\s*1)/iu,
  /(?<![A-Za-z])(?:No\.?\s*1|NO\.?\s*1)/iu,

  // Price superiority
  /(?:業界|日本|世界)?最安値/u,
  /他社より(?:安い|お得|[価]格|低[価]格)/u,
  /最低価格/u,

  // Efficacy / medical-sounding claims
  /(?:必ず|絶対に|100[%％])(?:痩せ|治り|美白|効果|効き)/u,
  /(?:痩せ|治[るり]|美白)(?:ます|る)(?:よ|!|！)?/u,
  /効果(?:を)?保証/u,

  // Competitor comparisons
  /(?:他店|他社|A社)(?:より|に比べて)(?:安い|優れ|良い|美味し)/u,

  // Absolutes / guarantees
  /保証(?:します|致します)/u,
  /確実に/u,
]

/** Flat list used by the retry prompt for human readability. */
export const RECOMMENDED_ALTERNATIVES: readonly string[] = GUARDRAIL_CATEGORIES.map(
  (c) => `${c.label}: ${c.recommended.map((r) => `「${r}」`).join('・')}`,
)

export interface GuardrailResult {
  passed: boolean
  violations: string[]
}

/** Scan text; return every pattern that matched (for logging + retry prompt). */
export function scanForbidden(text: string): GuardrailResult {
  const violations: string[] = []
  for (const pattern of FORBIDDEN_PATTERNS) {
    const m = text.match(pattern)
    if (m) violations.push(m[0])
  }
  return { passed: violations.length === 0, violations }
}

/**
 * Exact prompt addendum spec v2.0 §6.2 — pasted into the Claude system
 * message so the model knows the rules BEFORE generating, not just after.
 */
export const KJ_SYSTEM_PROMPT_ADDENDUM = `
【景品表示法対応 - 重要な制約事項】
以下の表現は絶対に使用しないこと:
- 最上級表現（「一番」「最高」「日本一」「No.1」等）
- 根拠のない価格比較（「業界最安値」「他社より安い」等）
- 効果・効能の断定（医薬品的・健康増進的な表現）
- 競合他社との具体的比較
- 「絶対に」「必ず」「保証する」等の断定表現
生成する文章は事実に基づき、誇張のない表現を使用すること。
`.trim()

/**
 * Retry prompt appended to the conversation when a first pass violated 景表法.
 * Keeps the original user intent but instructs the model to drop the matched
 * phrases and use recommended alternatives.
 */
export function buildRetryPrompt(violations: string[]): string {
  return [
    '前回の出力に景品表示法に違反する可能性のある表現が含まれていました。',
    `該当表現: ${violations.map((v) => `「${v}」`).join(', ')}`,
    'これらの表現を避け、次の代替表現を参考に、もう一度投稿文を生成してください:',
    RECOMMENDED_ALTERNATIVES.map((a) => ` - ${a}`).join('\n'),
    '',
    '出力は投稿文のみ。前置きや解説は一切含めないでください。',
  ].join('\n')
}
