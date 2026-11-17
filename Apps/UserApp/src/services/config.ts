// Dev builds: physical device over USB, forwarded via `adb reverse tcp:5000 tcp:5000`.
// (The Wi-Fi network here has client isolation enabled, blocking phone<->PC traffic.)
// Release builds: point at the deployed backend so the app works off this machine.
export const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'
  : 'https://ashwa-india.onrender.com/api';
