'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { createJWT, verifyPassphrase } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const { passphrase } = body;
  if (!passphrase) return err('Passphrase required');

  const db = getDB();

  // Check if a scrypt hash exists in the database (set after first password change)
  const { data: config } = await db
    .from('admin_config')
    .select('passphrase_hash')
    .eq('id', 1)
    .single();

  let isValid = false;

  if (config && config.passphrase_hash) {
    // Verify against stored scrypt hash
    isValid = verifyPassphrase(passphrase, config.passphrase_hash);
  } else {
    // Fall back to plain-text env var (initial setup, before first password change)
    const envPass = process.env.ADMIN_PASSPHRASE || 'edgeking2026';
    isValid = passphrase === envPass;
  }

  if (!isValid) return err('Invalid passphrase', 401);

  const token = createJWT({ role: 'admin' });
  return ok({ token });
};
