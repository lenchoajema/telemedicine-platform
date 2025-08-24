// Simple in-memory feature flag middleware
// Flags can be refreshed from env or future persistence

const flags = {
  phrEnabled: process.env.FEATURE_PHR_ENABLED !== 'false',
  phrShareLinks: process.env.FEATURE_PHR_SHARELINKS !== 'false',
  phrFhirExport: process.env.FEATURE_PHR_FHIR_EXPORT === 'true',
};

export function isFeatureEnabled(key){
  return !!flags[key];
}

export function requireFlag(flagKey){
  return function(req,res,next){
    if (!isFeatureEnabled(flagKey)) return res.status(403).json({ success:false, message:`Feature disabled: ${flagKey}` });
    next();
  };
}

export default flags;
