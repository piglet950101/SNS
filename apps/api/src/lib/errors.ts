import { ERROR_CODES, type ErrorCode } from '@postari/shared'

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const unauthorized = (msg = '認証が必要です') =>
  new HttpError(401, ERROR_CODES.UNAUTHORIZED, msg)

export const forbidden = (msg = 'アクセス権限がありません') =>
  new HttpError(403, ERROR_CODES.FORBIDDEN, msg)

export const notFound = (msg = 'リソースが見つかりません') =>
  new HttpError(404, ERROR_CODES.NOT_FOUND, msg)

export const conflict = (msg = '競合が発生しました') =>
  new HttpError(409, ERROR_CODES.CONFLICT, msg)

export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, ERROR_CODES.VALIDATION, msg, details)

export const trialExhausted = () =>
  new HttpError(
    402,
    ERROR_CODES.TRIAL_EXHAUSTED,
    '無料体験の生成回数を使い切りました。プランにご加入ください。',
  )

export const planLimitExceeded = () =>
  new HttpError(
    429,
    ERROR_CODES.PLAN_LIMIT_EXCEEDED,
    '今月の生成回数上限に達しました。',
  )
