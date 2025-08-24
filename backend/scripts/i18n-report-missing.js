#!/usr/bin/env node
/**
 * i18n-report-missing.js
 * Generate a gap report comparing a source (base) locale to one or more target locales.
 * Usage:
 *   node backend/scripts/i18n-report-missing.js --from en --to am-ET,fr,sw [--namespaces common,admin]
 *   MONGO_URI=mongodb://localhost:27018/telemedicine node backend/scripts/i18n-report-missing.js --from en --to am-ET
 */
import mongoose from 'mongoose';
import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import net from 'net';
import ContentTranslation from '../src/models/ContentTranslation.js';

const argv = yargs(hideBin(process.argv))
  .option('from', { type: 'string', demandOption: true, describe: 'Source (base) locale code' })
  .option('to', { type: 'string', demandOption: true, describe: 'Comma-separated target locale codes' })
  .option('namespaces', { type: 'string', describe: 'Comma-separated namespace filter (optional)' })
  .option('uri', { type: 'string', describe: 'Mongo connection string override (optional)' })
  .option('backfill-if-missing', { type: 'boolean', default: false, describe: 'If base locale empty, auto-create base entries from other locales before reporting' })
  .option('backfill-strategy', { type: 'string', default: 'copy', choices: ['copy','key','blank'], describe: 'Backfill value strategy when creating base rows' })
  .option('backfill-from-langs', { type: 'string', describe: 'Comma-separated list of source languages to use for backfill (defaults: all target locales then others)' })
  .help().argv;

const baseLocale = argv.from.trim();
const targetLocales = argv.to.split(',').map(s => s.trim()).filter(Boolean);
const nsFilter = argv.namespaces ? argv.namespaces.split(',').map(s => s.trim()) : null;

const uri = (argv.uri || process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
if (!uri) {
  console.log('ERROR: MONGO_URI not set in environment.');
  process.exit(1);
}

function sanitize(uriStr){
  return uriStr.replace(/:[^:@/]+@/, ':****@');
}

async function preflightCheck(u){
  // Skip SRV preflight (driver handles DNS)
  if (u.startsWith('mongodb+srv://')) return { skipped: true };
  try {
    // Basic parse for host:port
    const stripped = u.replace(/^mongodb:\/\//,'');
    const firstAt = stripped.indexOf('@');
    const hostPart = firstAt >= 0 ? stripped.substring(firstAt+1) : stripped;
    const firstSlash = hostPart.indexOf('/');
    const hostDb = firstSlash >= 0 ? hostPart.substring(0, firstSlash) : hostPart;
    const hostOnly = hostDb.split(',')[0]; // first host only
  const [host, portStr] = hostOnly.split(':');
  const port = Number(portStr || 27018);
    const start = Date.now();
    await new Promise((resolve, reject) => {
      const socket = net.connect({ host, port, timeout: 1500 }, () => { socket.end(); resolve(); });
      socket.on('error', reject);
      socket.on('timeout', () => { socket.destroy(new Error('timeout')); });
    });
    return { host, port, reachable: true, ms: Date.now()-start };
  } catch (e) {
    return { reachable: false, reason: e.message };
  }
}

function rowKey(row){
  // Normalize key to namespace.key (avoid duplicate prefix of namespace.namespace.*)
  if (!row) return '';
  let k = row.key || '';
  if (k.startsWith(row.namespace + '.')) k = k.substring(row.namespace.length + 1);
  return `${row.namespace}.${k}`;
}

(async () => {
  const start = Date.now();
  try {
    console.log('[i18n-report] Connecting to', sanitize(uri));
    const pre = await preflightCheck(uri);
    if (pre.reachable === false) {
      console.log('[i18n-report] Preflight TCP check failed:', pre.reason);
      console.log('[i18n-report] HINTS:');
      console.log('  - Ensure mongod is running locally OR use an Atlas connection string');
      console.log('  - If using Docker, confirm container name/port matches URI');
      console.log('  - For Atlas, use mongodb+srv URI and whitelist your IP');
    } else if (pre.reachable) {
      console.log(`[i18n-report] Host reachable (${pre.host}:${pre.port}) in ${pre.ms}ms`);
    }
    const t0 = Date.now();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    console.log('[i18n-report] Connected in', Date.now()-t0, 'ms');
    const nsQuery = nsFilter ? { namespace: { $in: nsFilter } } : {};

    // Fetch base locale rows
    const baseRows = await ContentTranslation.find({ language: baseLocale, ...nsQuery });
    const baseSet = new Set(baseRows.map(rowKey));

    if (baseSet.size === 0) {
      console.log(`WARN: No base translations found for locale '${baseLocale}'.`);
      if (argv['backfill-if-missing']) {
        console.log('[i18n-report] Auto backfill enabled. Building base set...');
        // Determine candidate languages
        let sourceLangs;
        if (argv['backfill-from-langs']) {
          sourceLangs = argv['backfill-from-langs'].split(',').map(s=>s.trim()).filter(Boolean);
        } else {
          // Prefer provided target locales first, then any others in DB
          const distinct = await ContentTranslation.distinct('language', nsQuery);
          sourceLangs = [...new Set([...targetLocales, ...distinct])].filter(l => l !== baseLocale);
        }
        console.log('[i18n-report] Backfill source languages:', sourceLangs.join(', ') || '(none)');
        const sourceRows = await ContentTranslation.find({ language: { $in: sourceLangs }, ...nsQuery });
        const seen = new Set();
        let inserted = 0;
        for (const r of sourceRows) {
          const k = rowKey(r);
          if (!seen.has(k)) {
            seen.add(k);
            let value;
            switch (argv['backfill-strategy']) {
              case 'blank': value = ''; break;
              case 'key': value = r.key; break;
              case 'copy':
              default: value = r.value; break;
            }
            await ContentTranslation.updateOne({ namespace: r.namespace, key: r.key, language: baseLocale }, { $set: { value } }, { upsert: true });
            baseSet.add(k);
            inserted++;
          }
        }
        console.log(`[i18n-report] Backfill complete. Inserted ${inserted} base (${baseLocale}) entries.`);
      } else {
        console.log("HINT: Run with --backfill-if-missing to auto-create base entries or seed base locale first (e.g. npm run seed:i18n).\n      Or use the standalone backfill script: node backend/scripts/i18n-backfill-base.js --base en --namespaces common,admin\n");
      }
    }

    for (const target of targetLocales) {
      const targetRows = await ContentTranslation.find({ language: target, ...nsQuery });
      const targetSet = new Set(targetRows.map(rowKey));

      const missing = [];
      for (const k of baseSet) if (!targetSet.has(k)) missing.push(k);

      const extra = [];
      for (const k of targetSet) if (!baseSet.has(k)) extra.push(k);

      missing.sort();
      extra.sort();

      console.log('==============================');
      console.log(`Locale Gap Report: ${target}`);
      console.log(`Base Locale     : ${baseLocale}`);
      if (nsFilter) console.log(`Namespaces      : ${nsFilter.join(', ')}`);
      console.log(`Base keys count : ${baseSet.size}`);
      console.log(`Target keys     : ${targetSet.size}`);
      console.log(`Missing keys    : ${missing.length}`);
      console.log(`Extra keys      : ${extra.length}`);
      console.log('------------------------------');
      if (missing.length) {
        console.log('Missing (need translation):');
        missing.forEach(k => console.log('  - ' + k));
      } else {
        console.log('No missing keys ✅');
      }
      if (extra.length) {
        console.log('\nExtra (exist only in target – consider removing or adding to base):');
        extra.forEach(k => console.log('  - ' + k));
      }
      console.log();
    }

    console.log(`Done in ${(Date.now() - start)}ms`);
    await mongoose.disconnect();
  } catch (err) {
  console.log('Failed to generate report:', err.message);
    if (err && err.message && err.message.includes('ECONNREFUSED')) {
      console.log('[i18n-report] Connection refused. Troubleshooting:');
      console.log('  1. Is MongoDB running? (If local: check your Mongo service or run `mongod`)');
      console.log('  2. Does the connection string host/port match the running instance?');
      console.log('  3. If using Atlas, confirm network access (IP whitelist) and credentials.');
  console.log('  4. Try: node backend/scripts/i18n-report-missing.js --uri "mongodb://127.0.0.1:27018/telemedicine" --from en --to am-ET');
    }
    process.exitCode = 1;
  }
})();
