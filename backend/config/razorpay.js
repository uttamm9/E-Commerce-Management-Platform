const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    'Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment variables. Gateway operations may fail.'
  );
}

const razorpayInstance = new Razorpay({
  key_id: keyId || 'rzp_test_placeholder',
  key_secret: keySecret || 'placeholder_secret',
});

module.exports = razorpayInstance;
