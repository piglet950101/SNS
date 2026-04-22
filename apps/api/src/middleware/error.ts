import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ERROR_CODES } from '@postari/shared'
import { HttpError } from '../lib/errors'
import { logger } from '../lib/logger'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    })
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION,
        message: '入力内容に誤りがあります',
        details: err.flatten(),
      },
    })
  }

  logger.error({ err }, 'Unhandled error in request pipeline')
  return res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL,
      message: 'サーバーエラーが発生しました',
    },
  })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: ERROR_CODES.NOT_FOUND, message: 'エンドポイントが存在しません' },
  })
}
