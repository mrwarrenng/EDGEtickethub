'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try { requireAdmin(event); } catch { return err('Unauthorized', 401); }

  const db = getDB();

  // Delete all tickets (cascades to votes and emails)
  const { error } = await db.from('tickets').delete().neq('id', '');
  if (error) return err(error.message, 500);

  // Reset sequence back to 1
  await db.rpc('setval', { seq_name: 'ticket_seq', val: 1 }).catch(() => null);

  return ok({ success: true });
};
