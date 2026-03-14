import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUser } from './db';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL ?? 'ahmedyassin525252@gmail.com')
  .toLowerCase()
  .trim();

function generateTempPassword() {
  // strong enough for temporary use, user should change immediately
  const part = () => Math.random().toString(36).slice(2);
  return `Tmp!${part()}-${part()}-${Date.now().toString(36)}`;
}

async function main() {
  const passwordRaw = String(process.env.ADMIN_PASSWORD ?? '').trim();
  const effectivePassword = passwordRaw.length > 0 ? passwordRaw : generateTempPassword();
  const passwordHash = await bcrypt.hash(effectivePassword, 10);

  const existing = await getUserByEmail(ADMIN_EMAIL);

  if (!existing) {
    const userId = await createUser({
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Ahmed (Primary Admin)',
      role: 'admin',
      isVerified: true,
      isBlocked: false,
      failedLoginAttempts: 0,
      lastSignedIn: null,
    });

    console.log('[bootstrap-admin] created admin user:', { email: ADMIN_EMAIL, userId });
  } else {
    await updateUser(existing.id, {
      passwordHash,
      role: 'admin',
      isVerified: true,
      isBlocked: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    console.log('[bootstrap-admin] updated existing user to admin:', { email: ADMIN_EMAIL, userId: existing.id });
  }

  console.log('---');
  console.log('ADMIN LOGIN');
  console.log('Email:', ADMIN_EMAIL);
  if (passwordRaw.length === 0) {
    console.log('Password: (generated - not printed)');
    console.log('IMPORTANT: set ADMIN_PASSWORD env and re-run if you need a known password.');
  } else {
    console.log('Password: (from ADMIN_PASSWORD env - not printed)');
  }
}

main().catch((err) => {
  console.error('[bootstrap-admin] failed:', err);
  process.exit(1);
});
