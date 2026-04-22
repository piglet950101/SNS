import nodemailer from 'nodemailer'
import { env } from '../env'
import { logger } from './logger'

let _t: nodemailer.Transporter | null = null

function transporter(): nodemailer.Transporter | null {
  if (_t) return _t
  const e = env()
  if (!e.SMTP_HOST || !e.SMTP_PORT) {
    logger.warn('SMTP not configured — email sending disabled')
    return null
  }
  _t = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_PORT === 465,
    auth: e.SMTP_USER && e.SMTP_PASS ? { user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
  })
  return _t
}

export interface MailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendMail(input: MailInput): Promise<boolean> {
  const t = transporter()
  if (!t) {
    logger.info({ to: input.to, subject: input.subject }, '[email disabled] would have sent')
    return false
  }
  await t.sendMail({
    from: env().FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })
  return true
}
