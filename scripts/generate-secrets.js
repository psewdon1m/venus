#!/usr/bin/env node

/**
 * Venus Platform - Secret Generation Script
 * Generates cryptographically secure secrets for JWT and sessions
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateJWTSecret() {
  // JWT secret should be at least 256 bits (32 bytes)
  return generateSecret(32);
}

function generateSessionSecret() {
  // Session secret should be at least 128 bits (16 bytes), but we use 32 for consistency
  return generateSecret(32);
}

console.log('# ==============================================');
console.log('# Venus Platform - Generated Secrets');
console.log('# ==============================================');
console.log('# Generated on:', new Date().toISOString());
console.log('# DO NOT commit these values to git!');
console.log('# ==============================================');
console.log('');
console.log('# JWT Secret (48+ characters for HS256)');
console.log(`JWT_SECRET=${generateJWTSecret()}`);
console.log('');
console.log('# Session Secret (32+ characters)');
console.log(`SESSION_SECRET=${generateSessionSecret()}`);
console.log('');
console.log('# Database Password (16+ characters)');
console.log(`DATABASE_PASSWORD=${generateSecret(16)}`);
console.log('');
console.log('# Redis Password (16+ characters)');
console.log(`REDIS_PASSWORD=${generateSecret(16)}`);
console.log('');
console.log('# ==============================================');
console.log('# Copy these values to your .env file');
console.log('# ==============================================');