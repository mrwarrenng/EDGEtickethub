'use strict';
const { createClient } = require('@supabase/supabase-js');

let _client;

function getDB() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _client;
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function ok(body, status = 200) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function err(message, status = 400) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ error: message }) };
}

function preflight() {
  return { statusCode: 204, headers: CORS, body: '' };
}

module.exports = { getDB, CORS, ok, err, preflight };
