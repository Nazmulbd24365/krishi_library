import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { hashPassword } from '../services/password.service';

/**
 * Safely create or update the first SUPER_ADMIN account.
 * Usage:  npm run create:admin
 * Set BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD in backend/.env first.
 * No default password is ever shipped.
 */
async function main() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || env.BOOTSTRAP_ADMIN_EMAIL).toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME || env.BOOTSTRAP_ADMIN_NAME;

  if (!password || password.length < 8) {
    console.error('❌ Set BOOTSTRAP_ADMIN_PASSWORD (min 8 chars) in backend/.env before running.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: 'SUPER_ADMIN', isActive: true },
    update: { name, passwordHash, role: 'SUPER_ADMIN', isActive: true },
  });

  console.log(`✅ Super admin ready: ${user.email} (role: ${user.role})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Failed to create admin:', err);
  await prisma.$disconnect();
  process.exit(1);
});
