const Razorpay = require('razorpay');
const crypto = require('crypto');

let client = null;

function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured on the server');
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

async function createRazorpayOrder({ amount, receipt, notes }) {
  const rzp = getClient();
  return rzp.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes,
  });
}

function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expected === razorpaySignature;
}

module.exports = { createRazorpayOrder, verifyPaymentSignature };
