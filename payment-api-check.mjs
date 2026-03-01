import { validatePaymentMethod } from './security.ts';

const allowed = ['mastercard', 'visa', 'asia_pay', 'zain_cash'];
const banned = ['paypal', 'stripe', 'payoneer', 'binance', 'okx', 'bank_transfer', 'usdt_trc20', 'western_union'];

let failed = false;

for (const m of allowed) {
  if (!validatePaymentMethod(m)) {
    console.error(`FAIL: allowed method rejected: ${m}`);
    failed = true;
  }
}

for (const m of banned) {
  if (validatePaymentMethod(m)) {
    console.error(`FAIL: banned method accepted: ${m}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OK: validatePaymentMethod allows only the 4 Iraqi methods.');
