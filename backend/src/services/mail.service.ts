import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.hasSmtp) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/** Best-effort notification email. Never throws to callers. */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) {
    logger.info({ to: opts.to }, 'SMTP not configured - skipping email');
    return false;
  }
  try {
    await tx.sendMail({ from: env.EMAIL_FROM, ...opts });
    return true;
  } catch (err) {
    logger.warn({ err }, 'Failed to send email');
    return false;
  }
}
