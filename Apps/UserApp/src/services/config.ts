// Physical device over USB: forwarded via `adb reverse tcp:5000 tcp:5000`.
// (The Wi-Fi network here has client isolation enabled, blocking phone<->PC traffic.)
export const API_BASE_URL = 'http://localhost:5000/api';
