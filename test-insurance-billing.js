#!/usr/bin/env node
import axios from 'axios';

const baseURL = process.env.API_URL || 'http://localhost:5000/api';

async function run() {
  console.log('== Insurance & Billing E2E Test ==');
  const ts = Date.now();
  const email = `insbill${ts}@example.com`;
  const password = 'password123';

  try {
    console.log('Registering test patient:', email);
    await axios.post(`${baseURL}/auth/register`, {
      email,
      password,
      role: 'patient',
      profile: { firstName: 'Ins', lastName: 'Bill' },
    }).catch(() => ({})); // ignore if exists

    console.log('Logging in...');
    const login = await axios.post(`${baseURL}/auth/login`, { email, password });
    const token = login.data.token;
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    console.log('Creating family group (sanity for mounts)...');
    await axios.post(`${baseURL}/family/groups`, {}, auth);

    console.log('Adding insurance...');
    const insCreate = await axios.post(`${baseURL}/insurance`, {
      provider: 'Test Insurance Co',
      plan: 'Gold',
      policyNumber: 'P' + ts,
      isPrimary: true,
    }, auth);
    console.log('Insurance created:', insCreate.data.item?._id);

    console.log('Listing insurance...');
    const insList = await axios.get(`${baseURL}/insurance`, auth);
    console.log('Insurance count:', insList.data.items?.length || 0);

    console.log('Adding payment method...');
    const pmCreate = await axios.post(`${baseURL}/billing/methods`, {
      type: 'card',
      brand: 'VISA',
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
      cardholderName: 'Ins Bill',
      billingAddress: { line1: '123 Main', city: 'NY', state: 'NY', postalCode: '10001', country: 'US' },
      isDefault: true,
    }, auth);
    console.log('Payment created:', pmCreate.data.item?._id);

    console.log('Listing payment methods...');
    const pmList = await axios.get(`${baseURL}/billing/methods`, auth);
    console.log('Payment methods count:', pmList.data.items?.length || 0);

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
