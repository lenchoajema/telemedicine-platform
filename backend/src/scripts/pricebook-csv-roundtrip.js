/*
 Admin-only CSV roundtrip check for a PriceBook.
 Usage: node src/scripts/pricebook-csv-roundtrip.js <priceBookId>
 Requires: NODE_ENV !== 'production'
 Outputs artifacts under tmp/pricebook-roundtrip/<pbId>/timestamp-
*/
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Buffer } from 'node:buffer';
import dotenv from 'dotenv';
import PriceBook from '../models/PriceBook.js';
import ServiceCatalog from '../models/ServiceCatalog.js';
import connectDB from '../modules/shared/db.js';

dotenv.config();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('This script is disabled in production.');
    process.exit(2);
  }
  const [, , pbId] = process.argv;
  if (!pbId) {
    console.log('Usage: node src/scripts/pricebook-csv-roundtrip.js <priceBookId>');
    process.exit(1);
  }
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(pbId)) {
    console.log('Invalid priceBookId');
    process.exit(1);
  }
  const pb = await PriceBook.findById(pbId);
  if (!pb) {
    console.log('PriceBook not found');
    process.exit(1);
  }
  const services = await ServiceCatalog.find({});
  const codeById = new Map(services.map(s => [String(s._id), s.code]));
  const idByCode = new Map(services.map(s => [s.code, String(s._id)]));

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'tmp', 'pricebook-roundtrip', String(pb._id), runId);
  fs.mkdirSync(dir, { recursive: true });

  const header = 'serviceCode,unitPrice,taxRate';
  const lines = (pb.items || []).map(i => {
    const code = codeById.get(String(i.serviceId)) || '';
    const unit = i.unitPrice ?? 0;
    const tax = i.taxRate ?? 0;
    return `${code},${unit},${tax}`;
  });
  const csv = [header, ...lines].join('\n');
  const csvPath = path.join(dir, 'export.csv');
  fs.writeFileSync(csvPath, csv);

  // Re-import: parse CSV and produce normalized JSON items
  const parsedLines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  parsedLines.shift(); // drop header
  const rows = parsedLines.map(l => l.split(',').map(s => s.trim()));
  const items = [];
  const errors = [];
  for (const r of rows) {
    const [serviceCode, unitPriceStr, taxRateStr] = r;
    const id = idByCode.get(serviceCode);
    if (!id) { errors.push(`Unknown serviceCode: ${serviceCode}`); continue; }
    const unit = Number(unitPriceStr || 0);
    const tax = Number(taxRateStr || 0);
    items.push({ serviceId: id, unitPrice: isNaN(unit) ? 0 : unit, taxRate: isNaN(tax) ? 0 : tax, discount: {} });
  }
  fs.writeFileSync(path.join(dir, 'normalized.json'), JSON.stringify({ items }, null, 2));
  if (errors.length) fs.writeFileSync(path.join(dir, 'errors.log'), errors.join('\n'));

  // Compute checksum (simple deterministic JSON string)
  function checksum(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const before = { items: (pb.items || []).map(i => ({ serviceId: String(i.serviceId), unitPrice: i.unitPrice, taxRate: i.taxRate || 0 })) };
  const after = { items: items.map(i => ({ serviceId: String(i.serviceId), unitPrice: i.unitPrice, taxRate: i.taxRate || 0 })) };
  const sumBefore = checksum(before);
  const sumAfter = checksum(after);
  const diff = [];
  const byIdBefore = new Map(before.items.map(i => [i.serviceId, i]));
  const byIdAfter = new Map(after.items.map(i => [i.serviceId, i]));
  for (const [id, a] of byIdAfter.entries()) {
    const b = byIdBefore.get(id);
    if (!b) diff.push({ type: 'added', id, item: a });
    else if (b.unitPrice !== a.unitPrice || (b.taxRate || 0) !== (a.taxRate || 0)) diff.push({ type: 'changed', id, before: b, after: a });
  }
  for (const [id, b] of byIdBefore.entries()) {
    if (!byIdAfter.has(id)) diff.push({ type: 'removed', id, item: b });
  }
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify({ sumBefore, sumAfter }, null, 2));
  fs.writeFileSync(path.join(dir, 'diff.json'), JSON.stringify(diff, null, 2));
  console.log(JSON.stringify({ ok: true, dir, sumBefore, sumAfter, diffCount: diff.length, errors: errors.length }, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
