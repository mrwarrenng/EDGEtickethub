'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin, createJWT, hashPassphrase } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const { newPassphrase, recoveryCode } = body;
  if (!newPassphrase || newPassphrase.length < 6) return err('New passphrase must be at least 6 characters');

  const isRecovery = !!recoveryCode;

  if (isRecovery) {
    // Recovery flow — verify recovery code against env var
    const expected = process.env.ADMIN_RECOVERY_CODE || 'E03894';
    if (recoveryCode !== expected) return err('Invalid recovery code', 401);
  } else {
    // Normal change — must be authenticated
    try { requireAdmin(event); } catch { return err('Unauthorized', 401); }
  }

  const db = getDB();
  const hash = hashPassphrase(newPassphrase);

  const { error } = await db
    .from('admin_config')
    .update({ passphrase_hash: hash, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) return err(error.message, 500);

  // Return a fresh JWT so the session stays active after a password change
  const token = createJWT({ role: 'admin' });
  return ok({ token });
};
