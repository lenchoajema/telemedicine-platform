#!/usr/bin/env node
const axios = require('axios');

const baseURL = process.env.API_URL || 'http://localhost:5000/api';

async function run() {
  console.log('== Pricing → Quote → Checkout Smoke Test ==');
  const ts = Date.now();
  const email = `pricing${ts}@example.com`;
  const password = 'password123';
  const region = process.env.REGION || 'ET';
  const payerType = process.env.PAYER_TYPE || 'SelfPay';
  const testMobile = process.env.TEST_MOBILE === '1';

  try {
    // Register user (ignore if exists)
    console.log('Registering test patient:', email);
  await axios.post(`${baseURL}/auth/register`, {
      email,
      password,
      role: 'patient',
      profile: { firstName: 'Price', lastName: 'Check' },
    }).catch(() => ({}));

    console.log('Logging in...');
    const login = await axios.post(`${baseURL}/auth/login`, { email, password });
    const token = (login.data && (login.data.token || (login.data.data && login.data.data.token))) || null;
    if (!token) {
      console.error('Login response did not include token:', login.data);
      process.exit(1);
    }
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    console.log('Fetching services for region=%s, payerType=%s ...', region, payerType);
  const svcRes = await axios.get(`${baseURL}/pricing/services`, { headers: auth.headers, params: { region, payerType } });
    const services = svcRes.data.items || [];
    console.log('Services found:', services.length);
    if (!services.length) {
      console.error('No services returned. Ensure service catalog and price book are seeded.');
      process.exit(2);
    }
    const svc = services[0];
    console.log('Using service:', svc.code, svc.name, svc.currency, svc.price);

    console.log('Creating quote...');
  const quoteRes = await axios.post(`${baseURL}/pricing/quote`, { items: [{ serviceCode: svc.code, qty: 1 }] }, auth);
    const quote = quoteRes.data.quote;
    if (!quote || !quote._id) {
      throw new Error('Quote not created');
    }
    const amount = Number(quote.patientResponsibility || quote.subtotal || 0);
    console.log('Quote created:', quote._id, 'Amount:', amount, quote.currency);
    if (!amount) throw new Error('Calculated amount is zero');

    console.log('Fetching quote by id...');
    const quoteGet = await axios.get(`${baseURL}/pricing/quotes/${quote._id}`, auth);
    if (!quoteGet.data || !quoteGet.data.quote || String(quoteGet.data.quote._id) !== String(quote._id)) {
      throw new Error('Quote lookup mismatch');
    }
    console.log('Quote lookup OK');

    console.log('Creating checkout intent...');
  const intentRes = await axios.post(`${baseURL}/checkout/intents`, { amount, currency: quote.currency || 'USD', method: 'Card', provider: undefined, quoteId: quote._id }, auth);
    const intent = intentRes.data.intent;
    if (!intent || !intent._id) throw new Error('Payment intent not created');
    console.log('Intent created:', intent._id, 'Status:', intent.status);

    if (testMobile) {
      console.log('Testing mobile wallet init (M-Pesa stub)...');
      try {
        const initRes = await axios.post(`${baseURL}/checkout/mpesa/stk-push`, { intentId: intent._id, phone: '+254700000000' }, auth);
        if (!initRes.data || !initRes.data.ok) throw new Error('M-Pesa init not OK');
        console.log('M-Pesa init OK');
      } catch (e) {
        console.warn('Mobile init failed (non-fatal for smoke):', e.response ? e.response.data : e.message);
      }
    }

    console.log('Listing payments (may be empty for Pending intent)...');
    const pays = await axios.get(`${baseURL}/checkout/payments`, auth);
    if (!pays.data || !Array.isArray(pays.data.items)) {
      throw new Error('Payments list not returned as array');
    }
    console.log('Payments list OK, count:', pays.data.items.length);

    console.log('OK ✅');
  } catch (e) {
    if (e.response) {
      console.error('HTTP ERROR', e.response.status, e.response.data);
    } else {
      console.error('ERROR', e.message);
    }
    process.exit(1);
  }
}

run();
