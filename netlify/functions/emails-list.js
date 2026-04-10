'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');
const { requireAdmin } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  try { requireAdmin(event); } catch { return err('Unauthorized', 401); }

  const db = getDB();
  const { data, error } = await db
    .from('emails')
    .select('*')
    .order('created', { ascending: false });

  if (error) return err(error.message, 500);
  return ok({ emails: data });
};
