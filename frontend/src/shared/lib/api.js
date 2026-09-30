import { getRoleForPath } from "@/shared/constants/sidebarMenus"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// Each role gets its own storage namespace so an admin session and a seller
// session can coexist in the same browser without logging each other out.
function keysFor(role) {
  return {
    access: `ashwa_${role}_access_token`,
    refresh: `ashwa_${role}_refresh_token`,
    user: `ashwa_${role}_user`,
  }
}

// Authenticated requests only ever happen on already-role-scoped routes
// (/admin/*, /seller/horses/*, /seller/store/*), so the active role can be
// read straight off the URL — no need to thread it through every call site.
function currentRole() {
  return getRoleForPath(window.location.pathname)
}

export function getSession(role = currentRole()) {
  try {
    const keys = keysFor(role)
    const accessToken = localStorage.getItem(keys.access)
    const refreshToken = localStorage.getItem(keys.refresh)
    const user = JSON.parse(localStorage.getItem(keys.user) || "null")
    return { role, accessToken, refreshToken, user }
  } catch (e) {
    return { role, accessToken: null, refreshToken: null, user: null }
  }
}

export function setSession(role, { accessToken, refreshToken, user }) {
  const keys = keysFor(role)
  localStorage.setItem(keys.access, accessToken)
  localStorage.setItem(keys.refresh, refreshToken)
  localStorage.setItem(keys.user, JSON.stringify(user))
}

export function clearSession(role = currentRole()) {
  Object.values(keysFor(role)).forEach((key) => localStorage.removeItem(key))
}

const refreshPromises = {}

async function refreshAccessToken(role) {
  const { refreshToken } = getSession(role)
  if (!refreshToken) throw new Error("No refresh token")

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error("Session expired")

  const data = await res.json()
  setSession(role, { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
  return data.accessToken
}

async function requestWithRefresh(path, buildOptions, auth) {
  const role = currentRole()
  const doFetch = async (accessToken) =>
    fetch(`${BASE_URL}${path}`, buildOptions(auth ? accessToken : null))

  let { accessToken } = getSession(role)
  let res = await doFetch(accessToken)

  if (res.status === 401 && auth && getSession(role).refreshToken) {
    try {
      refreshPromises[role] = refreshPromises[role] || refreshAccessToken(role)
      accessToken = await refreshPromises[role]
      delete refreshPromises[role]
      res = await doFetch(accessToken)
    } catch (e) {
      clearSession(role)
      window.dispatchEvent(new CustomEvent("ashwa-session-expired", { detail: { role } }))
      throw new Error("Session expired")
    }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || "Request failed")
  }
  return data
}

export async function apiFetch(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  return requestWithRefresh(
    path,
    (accessToken) => ({
      method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    auth
  )
}

// For multipart/form-data (file uploads). Pass a FormData instance as `formData`.
export async function apiUpload(path, { method = "PUT", formData, auth = true } = {}) {
  return requestWithRefresh(
    path,
    (accessToken) => ({
      method,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    }),
    auth
  )
}
