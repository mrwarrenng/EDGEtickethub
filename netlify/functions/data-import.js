'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try { requireAdmin(event); } catch { return err('Unauthorized', 401); }

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const tickets = Array.isArray(body.tickets) ? body.tickets : [];
  const emails = Array.isArray(body.emails) ? body.emails : [];

  if (!tickets.length && !emails.length) return err('No data to import');

  const db = getDB();
  let added = 0;

  // Upsert tickets (skip duplicates by ID)
  if (tickets.length) {
    const { data, error } = await db
      .from('tickets')
      .upsert(tickets, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    if (error) return err(error.message, 500);
    added = data ? data.length : 0;
  }

  // Upsert emails (skip duplicates by ID)
  if (emails.length) {
    // Remap camelCase fields from v1 exports to snake_case
    const mapped = emails.map(e => ({
      id: e.id,
      ticket_id: e.ticket_id || e.ticketId,
      to_email: e.to_email || e.to,
      to_name: e.to_name || e.toName,
      subject: e.subject,
      body: e.body,
      status: e.status || 'pending',
      created: e.created || new Date().toISOString(),
      sent_at: e.sent_at || e.sentAt || null,
    }));
    await db.from('emails').upsert(mapped, { onConflict: 'id', ignoreDuplicates: true });
  }

  return ok({ added });
};
