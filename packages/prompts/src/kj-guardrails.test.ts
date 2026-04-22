import { describe, expect, it } from 'vitest'
import { scanForbidden } from './kj-guardrails'

describe('scanForbidden', () => {
  it('passes clean text', () => {
    const r = scanForbidden('人気の限定パフェをぜひお試しください🍰 #秋葉原カフェ')
    expect(r.passed).toBe(true)
    expect(r.violations).toHaveLength(0)
  })

  it('catches 日本一', () => {
    const r = scanForbidden('日本一のメイドカフェ！')
    expect(r.passed).toBe(false)
    expect(r.violations).toContain('日本一')
  })

  it('catches No.1 variants (case-insensitive)', () => {
    expect(scanForbidden('業界No.1').passed).toBe(false)
    expect(scanForbidden('秋葉原 No.1 メイドカフェ').passed).toBe(false)
    expect(scanForbidden('the #1 cafe').passed).toBe(true) // "#1" is English, not matched
  })

  it('catches 最安値', () => {
    const r = scanForbidden('業界最安値で提供中')
    expect(r.passed).toBe(false)
  })

  it('catches 保証します', () => {
    const r = scanForbidden('満足を保証します')
    expect(r.passed).toBe(false)
  })

  it('does not false-positive on 人気', () => {
    const r = scanForbidden('お客様に人気のメニューです')
    expect(r.passed).toBe(true)
  })
})
