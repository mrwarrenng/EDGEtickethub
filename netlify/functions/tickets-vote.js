'use strict';
const crypto = require('crypto');
const { getDB, ok, err, preflight } = require('./utils/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body); } catch { return err('Invalid JSON'); }

  const { ticketId, name, email } = body;
  if (!ticketId) return err('ticketId required');

  // Build voter fingerprint for dedup (SHA-256 of IP + User-Agent)
  const ip = event.headers['x-nf-client-connection-ip']
    || event.headers['x-forwarded-for']?.split(',')[0].trim()
    || 'unknown';
  const ua = event.headers['user-agent'] || 'unknown';
  const voterHash = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex');

  const db = getDB();

  // Try to record the vote (unique constraint blocks duplicates)
  const { error: voteErr } = await db
    .from('votes')
    .insert({ ticket_id: ticketId, voter_hash: voterHash });

  if (voteErr) {
    if (voteErr.code === '23505') return err('Already voted', 409);
    return err(voteErr.message, 500);
  }

  // Increment vote count and optionally add to voters array
  const { data: ticket, error: tErr } = await db
    .from('tickets')
    .select('votes, voters')
    .eq('id', ticketId)
    .single();

  if (tErr) return err(tErr.message, 500);

  const voters = ticket.voters || [];
  if (name) voters.push({ name, email: email || '', date: new Date().toISOString() });

  const { data: updated, error: uErr } = await db
    .from('tickets')
    .update({ votes: (ticket.votes || 1) + 1, voters, updated: new Date().toISOString() })
    .eq('id', ticketId)
    .select('votes')
    .single();

  if (uErr) return err(uErr.message, 500);
  return ok({ votes: updated.votes });
};
