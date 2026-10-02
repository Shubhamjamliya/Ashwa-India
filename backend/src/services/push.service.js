const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { allRoles } = require('../utils/roleModel');

let app = null;

function getApp() {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const serviceAccount = JSON.parse(raw);
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

function isUnregistered(error) {
  const code = error?.code || '';
  return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token';
}

// FCM's multicast call caps out at 500 tokens per request.
const FCM_BATCH_SIZE = 500;

// Sends to a flat list of tokens, in batches, and returns the tokens that
// came back invalid (uninstalled app, revoked permission, etc.) so callers
// can prune them from whichever account(s) they belong to.
async function sendToTokens(tokens, { title, body, data }) {
  const firebaseApp = getApp();
  if (!firebaseApp || tokens.length === 0) return [];

  const messaging = getMessaging(firebaseApp);
  const invalidTokens = [];

  for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
    const batch = tokens.slice(i, i + FCM_BATCH_SIZE);
    const result = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)])),
    });
    result.responses.forEach((r, idx) => {
      if (!r.success && isUnregistered(r.error)) invalidTokens.push(batch[idx]);
    });
  }

  return invalidTokens;
}

// Sends a push to every FCM token on one specific account, and silently
// prunes tokens the client has since invalidated so they don't keep failing
// on every future send.
async function sendPushToAccount(role, accountId, { title, body, data } = {}) {
  const Model = allRoles[role];
  if (!Model) return;

  const account = await Model.findById(accountId).select('fcmTokens');
  const tokens = account?.fcmTokens || [];
  if (tokens.length === 0) return;

  const invalidTokens = await sendToTokens(tokens, { title, body, data });
  if (invalidTokens.length > 0) {
    await Model.findByIdAndUpdate(accountId, { $pullAll: { fcmTokens: invalidTokens } });
  }
}

// Sends a push to every account of the given role(s) that has at least one
// saved token — used for admin broadcast notifications.
async function sendPushToRoles(roles, { title, body, data } = {}) {
  for (const role of roles) {
    const Model = allRoles[role];
    if (!Model) continue;

    const accounts = await Model.find({ fcmTokens: { $exists: true, $ne: [] } }).select('fcmTokens');
    const tokens = accounts.flatMap(a => a.fcmTokens);
    if (tokens.length === 0) continue;

    const invalidTokens = await sendToTokens(tokens, { title, body, data });
    if (invalidTokens.length > 0) {
      await Model.updateMany({}, { $pullAll: { fcmTokens: invalidTokens } });
    }
  }
}

async function registerToken(role, accountId, token) {
  const Model = allRoles[role];
  if (!Model || !token) return;
  await Model.findByIdAndUpdate(accountId, { $addToSet: { fcmTokens: token } });
}

async function unregisterToken(role, accountId, token) {
  const Model = allRoles[role];
  if (!Model || !token) return;
  await Model.findByIdAndUpdate(accountId, { $pull: { fcmTokens: token } });
}

module.exports = { sendPushToAccount, sendPushToRoles, registerToken, unregisterToken };
