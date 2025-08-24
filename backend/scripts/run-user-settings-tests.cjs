#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
// Minimal custom runner to execute critical user settings flows without Jest transforms.
(async () => {
  const assert = (cond, msg) => { if(!cond) throw new Error(msg); };
  process.env.NODE_ENV='test';
  process.env.JWT_SECRET='test_secret';
  console.log('[runner] starting in-memory mongo');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  console.log('[runner] MONGO_URI', process.env.MONGO_URI);
  const { default: app } = await import('../src/app.js');
  const request = (await import('supertest')).default || require('supertest');

  async function register(email){
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'Password123!',
      profile: { firstName:'Mini', lastName:'User', phone:'+15550001111', gender:'Male' }
    });
    assert(res.status===201, 'Registration failed '+email+': '+res.status+' '+JSON.stringify(res.body));
    const token = res.body?.data?.token || res.body?.data?.user?.token || res.body?.token;
    const user = res.body?.data?.user;
    assert(token && user, 'Token or user missing');
    return { token, user };
  }

  console.log('[runner] registering test user');
  const { token, user } = await register('mini@example.com');
  console.log('[runner] user registered', user._id);
  const agg = await (await import('supertest')).default(app)
    .get(`/api/users/${user._id}/settings`).set('Authorization', `Bearer ${token}`);
  assert(agg.status===200, 'Aggregated fetch failed');
  console.log('Aggregated settings keys:', Object.keys(agg.body));
  console.log('SUCCESS: minimal runner completed');
  await mongo.stop();
})().catch(e=>{ console.error('Runner error', e); process.exit(1); });
