import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  access: 'ashwa_user_access_token',
  refresh: 'ashwa_user_refresh_token',
  user: 'ashwa_user_profile',
};

export type SessionUser = {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  status: string;
  role: 'user';
};

export type Session = {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
};

export async function getSession(): Promise<Session> {
  const [accessToken, refreshToken, userRaw] = await Promise.all([
    AsyncStorage.getItem(KEYS.access),
    AsyncStorage.getItem(KEYS.refresh),
    AsyncStorage.getItem(KEYS.user),
  ]);
  return {
    accessToken,
    refreshToken,
    user: userRaw ? (JSON.parse(userRaw) as SessionUser) : null,
  };
}

export async function setSession(session: {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}) {
  await Promise.all([
    AsyncStorage.setItem(KEYS.access, session.accessToken),
    AsyncStorage.setItem(KEYS.refresh, session.refreshToken),
    AsyncStorage.setItem(KEYS.user, JSON.stringify(session.user)),
  ]);
}

export async function clearSession() {
  await AsyncStorage.removeMany([KEYS.access, KEYS.refresh, KEYS.user]);
}
