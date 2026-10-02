// @react-native-firebase has no web implementation (native-only), and the web
// build is a preview anyway (see services/payments.ts) — no-op here instead
// of bundling native Firebase code into the browser build.
export async function registerPushToken(): Promise<void> {}
export async function unregisterPushToken(): Promise<void> {}
export function listenForTokenRefresh(): () => void {
  return () => {};
}
