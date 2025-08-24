export const featureFlags = {
  chartingTemplates: process.env.FEATURE_FLAG_CHARTING_TEMPLATES === 'true',
  erxEnabled: process.env.FEATURE_FLAG_ERX_ENABLED === 'true',
  cpoeLabsEnabled: process.env.FEATURE_FLAG_CPOE_LABS_ENABLED === 'true',
  cpoeImagingEnabled: process.env.FEATURE_FLAG_CPOE_IMAGING_ENABLED === 'true',
};
