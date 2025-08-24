// Minimal provider sync stubs. In real usage, call provider APIs.
import ProviderSyncLog from '../models/ProviderSyncLog.js';

export async function syncBanksFromProvider(provider, { countryIso2 }, upsertFn) {
  const log = await ProviderSyncLog.create({ provider, countryIso2, startedAt: new Date() });
  let added = 0, updated = 0;
  const errors = [];
  try {
    // Stub data by provider and country; replace with live API integrations
    const seed = generateSeed(provider, countryIso2);
    for (const b of seed) {
      const res = await upsertFn(b).catch(e => { errors.push(String(e)); return null; });
      if (!res) continue;
      if (res.__isNew) added++; else updated++;
    }
  } catch (e) {
    errors.push(String(e?.message || e));
  } finally {
    log.finishedAt = new Date();
    log.added = added;
    log.updated = updated;
    log.errorsJSON = { errors };
    await log.save();
  }
  return { added, updated, errors };
}

function generateSeed(provider, country) {
  const list = [];
  const push = (name, countryIso2, code) => list.push({ name, countryIso2, isInternational: false, providerCodes: { [provider]: code }, supportedChannels: ['bank_transfer'] });
  switch ((country || '').toUpperCase()) {
    case 'NG':
      push('Access Bank', 'NG', '044');
      push('Zenith Bank', 'NG', '057');
      push('First Bank of Nigeria', 'NG', '011');
      push('Guaranty Trust Bank', 'NG', '058');
      push('United Bank for Africa', 'NG', '033');
      push('Polaris Bank', 'NG', '076');
      push('Stanbic IBTC', 'NG', '221');
      push('Standard Chartered Nigeria', 'NG', '068');
      push('Citibank Nigeria', 'NG', '023');
      push('Fidelity Bank', 'NG', '070');
      push('Ecobank Nigeria', 'NG', '050');
      break;
    case 'KE':
      push('KCB Bank', 'KE', 'KCB');
      push('Equity Bank', 'KE', 'EQT');
      push('Co-operative Bank of Kenya', 'KE', 'COP');
      push('Absa Bank Kenya', 'KE', 'ABSA');
      push('Stanbic Bank Kenya', 'KE', 'SBK');
      push('Standard Chartered Kenya', 'KE', 'SCBK');
      push('NCBA Bank', 'KE', 'NCBA');
      push('I&M Bank', 'KE', 'IMB');
      push('Family Bank', 'KE', 'FMB');
      break;
    case 'ET':
      push('Commercial Bank of Ethiopia', 'ET', 'CBE');
      push('Dashen Bank', 'ET', 'DAS');
      push('Awash Bank', 'ET', 'AWA');
      push('Bank of Abyssinia', 'ET', 'BOA');
      push('Hibret Bank', 'ET', 'HIB');
      push('Zemen Bank', 'ET', 'ZEM');
      break;
    case 'ZA':
      push('Standard Bank', 'ZA', 'SBK');
      push('First National Bank', 'ZA', 'FNB');
      push('Absa Bank', 'ZA', 'ABSA');
      push('Nedbank', 'ZA', 'NED');
      push('Capitec', 'ZA', 'CPT');
      push('Investec', 'ZA', 'IVT');
      push('TymeBank', 'ZA', 'TYM');
      push('Bidvest Bank', 'ZA', 'BID');
      push('Citibank South Africa', 'ZA', 'CITI');
      break;
    case 'EG':
      push('National Bank of Egypt', 'EG', 'NBE');
      push('Banque Misr', 'EG', 'BM');
      push('Commercial International Bank', 'EG', 'CIB');
      push('QNB Alahli', 'EG', 'QNB');
      push('HSBC Egypt', 'EG', 'HSBC');
      push('Banque du Caire', 'EG', 'BDC');
      break;
    case 'GH':
      push('GCB Bank', 'GH', 'GCB');
      push('Absa Bank Ghana', 'GH', 'ABSA');
      push('Stanbic Bank Ghana', 'GH', 'SBG');
      push('Standard Chartered Ghana', 'GH', 'SCB');
      push('Ecobank Ghana', 'GH', 'ECO');
      push('Fidelity Bank Ghana', 'GH', 'FDB');
      push('Zenith Bank Ghana', 'GH', 'ZBG');
      break;
    case 'MA':
      push('Attijariwafa Bank', 'MA', 'ATW');
      push('Banque Populaire', 'MA', 'BP');
      push('Bank of Africa (BMCE)', 'MA', 'BOA');
      push('Société Générale Maroc', 'MA', 'SGM');
      push('Crédit du Maroc', 'MA', 'CDM');
      break;
    case 'TN':
      push('BIAT', 'TN', 'BIAT');
      push('Amen Bank', 'TN', 'AMEN');
      push('Attijari Bank Tunisia', 'TN', 'ATB');
      push("Banque de l’Habitat", 'TN', 'BH');
      push('UBCI', 'TN', 'UBCI');
      break;
    case 'UG':
      push('Stanbic Bank Uganda', 'UG', 'SBU');
      push('Centenary Bank', 'UG', 'CEN');
      push('Absa Bank Uganda', 'UG', 'ABSA');
      push('dfcu Bank', 'UG', 'DFCU');
      push('Standard Chartered Uganda', 'UG', 'SCU');
      break;
    case 'TZ':
      push('CRDB Bank', 'TZ', 'CRDB');
      push('NMB Bank', 'TZ', 'NMB');
      push('Stanbic Bank Tanzania', 'TZ', 'SBT');
      push('Absa Bank Tanzania', 'TZ', 'ABSA');
      break;
    case 'SN':
      push('Société Générale Sénégal', 'SN', 'SGS');
      push('Ecobank Sénégal', 'SN', 'ECO');
      push('Banque Atlantique', 'SN', 'BAT');
      push('UBA Sénégal', 'SN', 'UBA');
      break;
    case 'RW':
      push('Bank of Kigali', 'RW', 'BK');
      push('I&M Bank Rwanda', 'RW', 'IMR');
      push('Equity Bank Rwanda', 'RW', 'EBR');
      break;
    case 'CI':
      push('Société Générale CI', 'CI', 'SGCI');
      push('Ecobank CI', 'CI', 'ECOCI');
      push('Banque Atlantique CI', 'CI', 'BACI');
      push('NSIA Banque CI', 'CI', 'NSIA');
      break;
    case 'CM':
      push('Afriland First Bank', 'CM', 'AFB');
      push('Société Générale Cameroun', 'CM', 'SGC');
      push('UBA Cameroon', 'CM', 'UBAC');
      push('Ecobank Cameroon', 'CM', 'ECOC');
      break;
    case 'ZM':
      push('Zanaco', 'ZM', 'ZNC');
      push('Stanbic Bank Zambia', 'ZM', 'SBZ');
      push('Absa Bank Zambia', 'ZM', 'ABSA');
      push('FNB Zambia', 'ZM', 'FNBZ');
      break;
    default:
      // fallback minimal
      push('Sample Bank', (country || 'ET').toUpperCase(), 'SMP');
  }
  return list;
}
