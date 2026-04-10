'use strict';
const crypto = require('crypto');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me-in-netlify-env-vars';
const JWT_TTL = 4 * 60 * 60; // 4 hours in seconds

function createJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_TTL,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token) {
  if (!token) throw new Error('No token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig.padEnd(44, '=')), Buffer.from(expected.padEnd(44, '=')))) {
    throw new Error('Invalid signature');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

function extractToken(event) {
  const auth = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function requireAdmin(event) {
  const token = extractToken(event);
  verifyJWT(token); // throws on failure
}

function hashPassphrase(passphrase) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passphrase, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassphrase(passphrase, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(passphrase, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

module.exports = { createJWT, verifyJWT, requireAdmin, hashPassphrase, verifyPassphrase };
