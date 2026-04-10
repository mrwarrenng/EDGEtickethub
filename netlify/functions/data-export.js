'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  try { requireAdmin(event); } catch { return err('Unauthorized', 401); }

  const db = getDB();
  const [ticketsRes, emailsRes] = await Promise.all([
    db.from('tickets').select('*').order('created', { ascending: true }),
    db.from('emails').select('*').order('created', { ascending: true }),
  ]);

  if (ticketsRes.error) return err(ticketsRes.error.message, 500);
  if (emailsRes.error) return err(emailsRes.error.message, 500);

  return ok({
    tickets: ticketsRes.data,
    emails: emailsRes.data,
    exportedAt: new Date().toISOString(),
    version: 2,
  });
};
