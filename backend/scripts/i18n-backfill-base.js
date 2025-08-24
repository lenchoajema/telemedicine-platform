#!/usr/bin/env node
/**
 * i18n-backfill-base.js
 * Create missing base locale (e.g. 'en') records for all namespace/key pairs that exist
 * in other locales so the gap report has a true baseline.
 *
 * Usage:
 *   MONGO_URI=mongodb://localhost:27018/telemedicine \
 *   node backend/scripts/i18n-backfill-base.js --base en [--namespaces common,admin] [--from-langs am,am-ET,fr,sw] [--strategy copy]
 *
 * Strategies:
 *   copy   - copy the first found target language value (default)
 *   key    - use the key (e.g. nav.home -> 'nav.home') as placeholder
 *   blank  - insert empty string value
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ContentTranslation from '../src/models/ContentTranslation.js';

const argv = yargs(hideBin(process.argv))
  .option('base', { type: 'string', demandOption: true, describe: 'Base locale to backfill (e.g. en)' })
  .option('namespaces', { type: 'string', describe: 'Comma separated namespace filter' })
  .option('from-langs', { type: 'string', describe: 'Comma separated list of source languages to consider (default: all except base)' })
  .option('strategy', { type: 'string', choices: ['copy','key','blank'], default: 'copy', describe: 'Value generation strategy for new base entries' })
  .option('uri', { type: 'string', describe: 'Mongo URI override (else MONGO_URI env)' })
  .help().argv;

const baseLocale = argv.base.trim();
const nsFilter = argv.namespaces ? argv.namespaces.split(',').map(s=>s.trim()).filter(Boolean) : null;
const strategy = argv.strategy;
const mongoUri = (argv.uri || process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
if (!mongoUri) { console.log('ERROR: MONGO_URI not provided.'); process.exit(1); }

function deriveValue(row){
  if (strategy === 'copy') return row.value;
  if (strategy === 'blank') return '';
  if (strategy === 'key') return row.key; // key only (without namespace prefix) already stored in row.key
  return row.value;
}

(async () => {
  const start = Date.now();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  const nsQuery = nsFilter ? { namespace: { $in: nsFilter } } : {};

  // Determine candidate source languages
  let sourceLangs;
  if (argv['from-langs']) {
    sourceLangs = argv['from-langs'].split(',').map(s=>s.trim()).filter(l => l && l !== baseLocale);
  } else {
    sourceLangs = await ContentTranslation.distinct('language', { ...nsQuery, language: { $ne: baseLocale } });
  }
  console.log('[backfill] Source languages considered:', sourceLangs.join(', ') || '(none)');

  // Build existing base set
  const baseRows = await ContentTranslation.find({ language: baseLocale, ...nsQuery }, { namespace:1, key:1 });
  const baseSet = new Set(baseRows.map(r => r.namespace + '\u0000' + r.key));

  // Fetch all potential rows from source languages
  const sourceRows = await ContentTranslation.find({ language: { $in: sourceLangs }, ...nsQuery });

  const toInsertMap = new Map(); // key(namespace\0key) -> value
  for (const row of sourceRows) {
    const k = row.namespace + '\u0000' + row.key;
    if (!baseSet.has(k) && !toInsertMap.has(k)) {
      toInsertMap.set(k, deriveValue(row));
    }
  }

  const entries = Array.from(toInsertMap.entries());
  if (!entries.length) {
    console.log('[backfill] No missing base entries to create. ✅');
    await mongoose.disconnect();
    return;
  }

  console.log(`[backfill] Creating ${entries.length} base (${baseLocale}) entries using strategy '${strategy}'...`);
  let created = 0;
  for (const [compound, value] of entries) {
    const [namespace, key] = compound.split('\u0000');
    await ContentTranslation.updateOne(
      { namespace, key, language: baseLocale },
      { $setOnInsert: { value }, $set: { value } },
      { upsert: true }
    );
    created++;
  }
  console.log(`[backfill] Done. Inserted/updated ${created} documents in ${(Date.now()-start)}ms.`);
  await mongoose.disconnect();
})().catch(e => { console.log('Backfill failed:', e); process.exit(1); });
