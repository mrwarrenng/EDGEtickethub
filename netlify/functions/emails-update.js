'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try { requireAdmin(event); } catch { return err('Unauthorized', 401); }

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const { emailId, status } = body;
  if (!emailId || !['pending', 'sent'].includes(status)) return err('emailId and valid status required');

  const db = getDB();
  const updates = {
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  };

  const { data, error } = await db
    .from('emails')
    .update(updates)
    .eq('id', emailId)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok({ email: data });
};
