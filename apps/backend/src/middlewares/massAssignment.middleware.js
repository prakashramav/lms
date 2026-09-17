/**
 * Mass Assignment Protection Middleware
 * Strips privileged fields from client request bodies to prevent unauthorized privilege escalation,
 * status tampering, and metadata spoofing.
 */

const FORBIDDEN_CLIENT_FIELDS = [
  'role',
  'permissions',
  'isSuperAdmin',
  'createdBy',
  'updatedBy',
  'publishedBy',
  'reviewedBy',
  'resetPasswordToken',
  'resetPasswordExpires',
  'emailVerificationToken',
  'emailVerificationExpires',
];

const protectMassAssignment = (req, res, next) => {
  // Allow administrative controllers that have explicitly authenticated with ADMIN / SUPER_ADMIN role
  const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');

  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    // If client attempts to mutate privileged fields and is not admin, strip them
    if (!isAdmin) {
      for (const field of FORBIDDEN_CLIENT_FIELDS) {
        if (field in req.body) {
          delete req.body[field];
        }
      }
    }
  }

  next();
};

module.exports = protectMassAssignment;
