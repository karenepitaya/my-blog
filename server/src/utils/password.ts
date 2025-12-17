import crypto from 'node:crypto';

const DEFAULT_LENGTH = 12;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function generateInitialPassword(length: number = DEFAULT_LENGTH): string {
  const safeLength = Number.isFinite(length) ? Math.floor(length) : DEFAULT_LENGTH;
  const finalLength = Math.max(8, Math.min(64, safeLength));

  let out = '';
  for (let i = 0; i < finalLength; i++) {
    const index = crypto.randomInt(0, ALPHABET.length);
    out += ALPHABET[index];
  }

  return out;
}

