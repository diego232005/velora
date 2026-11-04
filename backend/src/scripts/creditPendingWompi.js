/**
 * Acredita una transacción Wompi ya APPROVED (por id de redirect).
 * Uso: node src/scripts/creditPendingWompi.js 12237394-1793225910-38476
 */
import 'dotenv/config';
import { createSessionToken } from '../middleware/auth.js';

const transactionId = process.argv[2] || '12237394-1793225910-38476';
const reference = process.argv[3] || 'VLR81793225839731';
const userId = Number(process.argv[4] || 8);
const token = createSessionToken(userId);

await new Promise((r) => setTimeout(r, 800));

const res = await fetch('http://127.0.0.1:4000/api/payments/wompi/sync-transaction', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ transactionId, reference }),
});
const text = await res.text();
console.log(res.status, text);
process.exit(res.ok ? 0 : 1);
