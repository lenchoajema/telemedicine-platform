import dotenv from 'dotenv';
import connectDB from '../modules/shared/db.js';
import ServiceCatalog from '../models/ServiceCatalog.js';
import PriceBook from '../models/PriceBook.js';

dotenv.config();

async function run() {
  await connectDB();
  const services = [
    { code: 'CONSULT_TELE', name: 'Telemedicine Consultation', description: 'Virtual visit with a clinician', defaultPrice: 25, currency: 'USD' },
    { code: 'FOLLOW_UP', name: 'Follow-up Visit', description: 'Short follow-up visit', defaultPrice: 15, currency: 'USD' },
    { code: 'LAB_BASIC', name: 'Basic Lab Panel', description: 'Standard lab tests panel', defaultPrice: 20, currency: 'USD' },
  ];
  for (const s of services) {
    await ServiceCatalog.updateOne({ code: s.code }, { $setOnInsert: s }, { upsert: true });
  }
  const all = await ServiceCatalog.find({ code: { $in: services.map(s => s.code) } });
  const idMap = Object.fromEntries(all.map(s => [s.code, s._id]));
  const now = new Date();
  const pb = {
    region: 'ET',
    payerType: 'SelfPay',
    effectiveFrom: now,
    items: [
      { serviceId: idMap['CONSULT_TELE'], unitPrice: 25, taxRate: 0, discount: {} },
      { serviceId: idMap['FOLLOW_UP'], unitPrice: 15, taxRate: 0, discount: {} },
      { serviceId: idMap['LAB_BASIC'], unitPrice: 20, taxRate: 0, discount: {} },
    ],
  };
  await PriceBook.deleteMany({ region: pb.region, payerType: pb.payerType });
  await PriceBook.create(pb);
  console.log('Seeded services and price book for region ET, SelfPay');
  process.exit(0);
}

run().catch((e) => { console.log(e); process.exit(1); });
