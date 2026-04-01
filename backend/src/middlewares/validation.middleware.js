/**
 * Input Validation & Sanitization Utilities
 * Prevents XSS, HTML injection, and validates user inputs
 */

/**
 * Sanitize string to remove/reject dangerous characters and HTML tags
 * @param {string} input - Input string to sanitize
 * @param {boolean} strict - If true, reject any HTML tags; if false, remove them
 * @returns {string|null} Sanitized string or null if contains dangerous content
 */
export const sanitizeString = (input, strict = true) => {
  if (!input || typeof input !== 'string') return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Check for HTML tags - reject if strict mode
  const htmlTagRegex = /<[^>]*>/g;
  if (htmlTagRegex.test(sanitized)) {
    if (strict) {
      return null; // Reject if strict mode
    }
    sanitized = sanitized.replace(htmlTagRegex, ''); // Remove tags if not strict
  }

  // Check for script tags specifically
  const scriptRegex = /(<script|javascript:|onerror|onload|onclick|<iframe|<embed|<object)/gi;
  if (scriptRegex.test(sanitized)) {
    return null; // Always reject script-like content
  }

  // Check for SQL injection patterns
  const sqlRegex = /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi;
  if (sqlRegex.test(sanitized)) {
    return null; // Reject SQL keywords
  }

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone?.replace(/\D/g, ''));
};

/**
 * Validate shop name (alphanumeric + spaces, no special chars)
 * @param {string} name - Shop name to validate
 * @returns {boolean} True if valid
 */
export const validateShopName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Allow letters, numbers, spaces, hyphens, apostrophes, commas, periods
  // Reject HTML tags, special characters
  const validNameRegex = /^[a-zA-Z0-9\s\-',.&]{3,100}$/;
  return validNameRegex.test(name.trim());
};

/**
 * Validate address (similar to shop name)
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const validateAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  const validAddressRegex = /^[a-zA-Z0-9\s,.\-#/]{5,200}$/;
  return validAddressRegex.test(address.trim());
};

/**
 * Middleware to validate and sanitize shop creation/update requests
 */
export const validateShopInput = (req, res, next) => {
  try {
    const { shopName, ownerName, description, address } = req.body;

    // Validate shop name
    if (shopName) {
      if (!validateShopName(shopName)) {
        return res.status(400).json({
          message: 'Invalid shop name. Use only letters, numbers, spaces, hyphens, and apostrophes (3-100 characters).',
          field: 'shopName'
        });
      }
      req.body.shopName = shopName.trim();
    }

    // Validate owner name
    if (ownerName) {
      if (!validateShopName(ownerName)) {
        return res.status(400).json({
          message: 'Invalid owner name. Use only letters, numbers, spaces, and hyphens.',
          field: 'ownerName'
        });
      }
      req.body.ownerName = ownerName.trim();
    }

    // Validate and sanitize description
    if (description) {
      const sanitized = sanitizeString(description, false);
      if (!sanitized) {
        return res.status(400).json({
          message: 'Description contains invalid characters or HTML tags.',
          field: 'description'
        });
      }
      req.body.description = sanitized;
    }

    // Validate address fields
    if (address) {
      if (address.street && !validateAddress(address.street)) {
        return res.status(400).json({
          message: 'Invalid street address.',
          field: 'address.street'
        });
      }
      if (address.city && !validateShopName(address.city)) {
        return res.status(400).json({
          message: 'Invalid city name.',
          field: 'address.city'
        });
      }
      if (address.shopNumber && !sanitizeString(address.shopNumber, false)) {
        return res.status(400).json({
          message: 'Invalid shop number.',
          field: 'address.shopNumber'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      message: 'Input validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate and sanitize user input
 */
export const validateUserInput = (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (name) {
      if (!validateShopName(name)) {
        return res.status(400).json({
          message: 'Invalid name format.',
          field: 'name'
        });
      }
      req.body.name = name.trim();
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          message: 'Invalid email format.',
          field: 'email'
        });
      }
      req.body.email = email.toLowerCase().trim();
    }

    if (phone) {
      if (!validatePhone(phone)) {
        return res.status(400).json({
          message: 'Invalid phone number. Must be 10 digits.',
          field: 'phone'
        });
      }
      req.body.phone = phone.replace(/\D/g, '');
    }

    next();
  } catch (error) {
    return res.status(400).json({
      message: 'Input validation failed',
      error: error.message
    });
  }
};

export default {
  sanitizeString,
  validateEmail,
  validatePhone,
  validateShopName,
  validateAddress,
  validateShopInput,
  validateUserInput
};
