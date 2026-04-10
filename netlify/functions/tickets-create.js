'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const isMigration = body._migration === true;

  // Server-side spam checks (skipped for migration imports)
  if (!isMigration) {
    if (body._hp) return err('Spam detected', 400); // honeypot
    const formTs = parseInt(body.formTs || '0');
    if (formTs && Date.now() - formTs < 3000) return err('Submitted too fast', 400);
  }

  // Validate required fields
  const required = ['type', 'page', 'title', 'description', 'submitter', 'email', 'severity'];
  for (const f of required) {
    if (!body[f]) return err(`Missing required field: ${f}`);
  }
  if (!isMigration) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return err('Invalid email');
    if (body.description.length < 20) return err('Description too short');
  }

  const db = getDB();
  const now = new Date().toISOString();

  // Determine ticket ID
  let ticketId;
  if (isMigration && body.id) {
    ticketId = body.id;
  } else {
    const { data: seq, error: seqErr } = await db.rpc('nextval', { seq_name: 'ticket_seq' }).single();
    if (seqErr) {
      // Fallback: count existing tickets
      const { count } = await db.from('tickets').select('*', { count: 'exact', head: true });
      ticketId = 'EDGE-' + String((count || 0) + 1).padStart(3, '0');
    } else {
      ticketId = 'EDGE-' + String(seq).padStart(3, '0');
    }
  }

  const ticket = {
    id: ticketId,
    type: body.type,
    page: body.page,
    section: body.section || null,
    title: body.title,
    description: body.description,
    severity: body.severity,
    browser: body.browser || null,
    submitter: body.submitter,
    email: body.email,
    affiliation: body.affiliation || null,
    department: body.department || null,
    organization: body.organization || null,
    status: body.status || 'open',
    votes: body.votes || 1,
    voters: body.voters || [{ name: body.submitter, email: body.email, date: now }],
    notes: body.notes || [],
    resolution: body.resolution || null,
    created: body.created || now,
    updated: body.updated || now,
  };

  const { data, error } = isMigration
    ? await db.from('tickets').upsert(ticket, { onConflict: 'id', ignoreDuplicates: true }).select().single()
    : await db.from('tickets').insert(ticket).select().single();

  if (error) {
    if (error.code === '23505') return err('Ticket already exists', 409);
    return err(error.message, 500);
  }

  return ok({ ticket: data || ticket }, 201);
};
