const validator = require('validator');

const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Username validation
  if (!username || !validator.isLength(username, { min: 3, max: 30 })) {
    errors.push('Username must be between 3 and 30 characters');
  }
  if (!validator.matches(username, /^[a-zA-Z0-9_]+$/)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || !validator.isLength(password, { min: 8 })) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!validator.matches(password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', ') });
  }

  // Sanitize inputs
  req.body.username = validator.escape(username);
  req.body.email = validator.normalizeEmail(email);

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || !validator.isLength(password, { min: 8 })) {
    errors.push('Invalid credentials');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', ') });
  }

  req.body.email = validator.normalizeEmail(email);

  next();
};

module.exports = {
  validateRegistration,
  validateLogin
}; 