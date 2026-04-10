'use strict';
const { getDB } = require('./utils/db');

// Runs once daily to prevent Supabase free tier from pausing due to inactivity.
// Schedule is set in netlify.toml — add this to [functions] section:
//   [functions."keepalive"]
//   schedule = "@daily"

exports.handler = async () => {
  try {
    const db = getDB();
    const { error } = await db.from('tickets').select('id').limit(1);
    if (error) {
      console.error('Keep-alive ping failed:', error.message);
      return { statusCode: 500, body: 'ping failed' };
    }
    console.log('Keep-alive ping OK at', new Date().toISOString());
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('Keep-alive error:', e);
    return { statusCode: 500, body: 'error' };
  }
};
