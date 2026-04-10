'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try { requireAdmin(event); } catch { return err('Unauthorized', 401); }

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const { ticketId, status, note, email: emailDraft } = body;
  if (!ticketId || !status || !note) return err('ticketId, status, and note are required');

  const db = getDB();
  const now = new Date().toISOString();

  // Fetch existing ticket to get current notes
  const { data: existing, error: fetchErr } = await db
    .from('tickets')
    .select('notes')
    .eq('id', ticketId)
    .single();

  if (fetchErr) return err('Ticket not found', 404);

  const notes = [...(existing.notes || []), { status, text: note, date: now }];
  const updates = {
    status,
    notes,
    updated: now,
    ...(status === 'resolved' || status === 'rejected' ? { resolution: note } : {}),
  };

  const { data: ticket, error: updateErr } = await db
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (updateErr) return err(updateErr.message, 500);

  // Create email queue entry
  const emailId = 'EM-' + Date.now().toString(36).toUpperCase();
  const emailRecord = {
    id: emailId,
    ticket_id: ticketId,
    to_email: emailDraft?.to || ticket.email,
    to_name: emailDraft?.toName || ticket.submitter,
    subject: emailDraft?.subject || `[EDGE ${ticketId}] Update`,
    body: emailDraft?.body || note,
    status: 'pending',
    created: now,
  };

  const { data: email, error: emailErr } = await db
    .from('emails')
    .insert(emailRecord)
    .select()
    .single();

  if (emailErr) return err(emailErr.message, 500);
  return ok({ ticket, email });
};
