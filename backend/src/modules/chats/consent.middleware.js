// Middleware to verify user chat consent
export const verifyChatConsent = (req, res, next) => {
  // Consent middleware temporarily disabled - allow all chat requests
  next();
};
