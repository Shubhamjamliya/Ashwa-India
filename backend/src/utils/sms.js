// Sends OTP SMS via SMS India Hub. Only called when USE_DEFAULT_OTP is not 'true'.
async function sendOtpSms(phone, otp) {
  const digits = String(phone || '').replace(/\D/g, '');
  const msisdn = digits.startsWith('91') ? digits : `91${digits}`;
  const message = `Your Ashwa India OTP is ${otp}. Do not share this with anyone.`;

  const url = new URL('http://cloud.smsindiahub.in/vendorsms/pushsms.aspx');
  url.searchParams.append('APIKey', process.env.SMS_INDIA_HUB_API_KEY || '');
  url.searchParams.append('sid', process.env.SMS_INDIA_HUB_SENDER_ID || '');
  url.searchParams.append('msisdn', msisdn);
  url.searchParams.append('msg', message);
  url.searchParams.append('gwid', '2');
  url.searchParams.append('fl', '0');
  if (process.env.SMS_INDIA_HUB_USERNAME) {
    url.searchParams.append('uname', process.env.SMS_INDIA_HUB_USERNAME);
  }
  if (process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID) {
    url.searchParams.append('DLT_TE_ID', process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID);
  }

  try {
    const response = await fetch(url.toString());
    const resultText = await response.text();
    console.log(`[SMS] OTP sent to ${msisdn}: ${resultText}`);
  } catch (err) {
    // OTP is already saved; a failed SMS send shouldn't block the request/verify flow.
    console.error(`[SMS] Failed to send OTP to ${phone}:`, err.message);
  }
}

module.exports = { sendOtpSms };
