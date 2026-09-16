const validateEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  return typeof email === 'string' && re.test(email.trim());
};

const validatePassword = (password) => {
  // Min 8 chars, at least one letter and one number
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters long',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain both letters and numbers',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
      errorCode: 'VALIDATION_ERROR',
    });
  }
  next();
};

const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Reset token is required',
      errorCode: 'VALIDATION_ERROR',
    });
  }
  if (!password || !validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain both letters and numbers',
      errorCode: 'VALIDATION_ERROR',
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
