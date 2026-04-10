'use strict';
const { getDB, ok, err, preflight } = require('./utils/db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const db = getDB();
  const { data, error } = await db
    .from('tickets')
    .select('*')
    .order('created', { ascending: false });

  if (error) return err(error.message, 500);
  return ok({ tickets: data });
};
