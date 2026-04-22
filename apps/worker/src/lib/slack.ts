import { env } from '../env'
import { logger } from './logger'

export async function slackAlert(text: string): Promise<void> {
  const url = env().SLACK_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (err) {
    logger.warn({ err }, 'slack alert failed')
  }
}
