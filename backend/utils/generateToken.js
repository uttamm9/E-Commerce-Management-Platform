const jwt = require('jsonwebtoken');

/**
 * Generate a JSON Web Token for an authenticated user.
 * Payload includes only the user's MongoDB ID.
 *
 * @param {string} userId - User's MongoDB _id
 * @returns {string} - Signed JWT string
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

module.exports = generateToken;
