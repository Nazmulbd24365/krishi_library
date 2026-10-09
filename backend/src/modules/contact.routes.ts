import { Router } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler } from '../utils/async-handler';
import { created } from '../utils/api-response';
import { validate } from '../middleware/validate';
import { contactSchema } from './schemas';
import { formLimiter } from '../middleware/rate-limit';
import { sendMail } from '../services/mail.service';

const router = Router();

/** Very small in-memory hook/Honeypot + duplicate throttle guard. */
const recent = new Map<string, number>();

router.post(
  '/',
  formLimiter,
  validate({ body: contactSchema }),
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Basic spam guard: identical payload from the same IP within 60s is ignored.
    const key = `${req.ip}:${email}:${message.slice(0, 40)}`;
    const now = Date.now();
    if (recent.get(key) && now - recent.get(key)! < 60_000) {
      return created(res, { received: true });
    }
    recent.set(key, now);

    const saved = await prisma.contactMessage.create({
      data: {
        name,
        email: email.toLowerCase(),
        subject: subject ?? null,
        message,
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
      select: { id: true, createdAt: true },
    });

    // Best-effort notification; never promise delivery.
    if (env.hasSmtp && env.CONTACT_NOTIFY_EMAIL) {
      await sendMail({
        to: env.CONTACT_NOTIFY_EMAIL,
        subject: `New contact message: ${subject ?? '(no subject)'}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
    }

    return created(res, { id: saved.id, received: true, notified: env.hasSmtp });
  }),
);

export default router;
