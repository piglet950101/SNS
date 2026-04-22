import { eq } from 'drizzle-orm'
import { users } from '@postari/db'
import { db } from '../lib/db'
import { sendMail } from '../lib/email'
import { env } from '../env'
import { logger } from '../lib/logger'

export interface NotifyTokenExpiredData {
  userId: string
  platform: string
}

export async function processNotifyTokenExpired(data: NotifyTokenExpiredData): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, data.userId),
    columns: { email: true },
  })
  if (!user) return

  const e = env()
  const platformJa = data.platform === 'x' ? 'X（旧Twitter）' : data.platform
  const subject = `【Postari】${platformJa}の再連携が必要です`
  const body = [
    'いつも Postari をご利用いただきありがとうございます。',
    '',
    `${platformJa}との連携の有効期限が切れました。`,
    '自動投稿を再開するには、以下の手順で再度連携をお願いいたします。',
    '',
    `1. ${e.APP_URL}/settings/sns にアクセス`,
    '2. 「Xを再連携」ボタンをタップ',
    '',
    'ご不明点は support@postari.jp までお問い合わせください。',
    '',
    '株式会社アテナ / Postari',
  ].join('\n')

  await sendMail({ to: user.email, subject, text: body })
  logger.info({ userId: data.userId, platform: data.platform }, 'sent token-expiry notification')
}
