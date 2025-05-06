// Middleware to check if user has admin role
export const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }
  next();
};

// Middleware to check if user has doctor role
export const authorizeDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Unauthorized: Doctor access required' });
  }
  next();
};

// Middleware to check if user is the requested doctor or an admin
export const authorizeDoctorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.user.role === 'doctor' && req.params.doctorId === req.user.doctorId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Unauthorized: Insufficient permissions' });
};
