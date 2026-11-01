const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let accessToken = "";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });
  if (!response.ok) {
    let message = "Something went wrong.";
    try { message = (await response.json()).message || message; } catch { /* non-JSON error */ }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export async function registerAccount(payload) {
  const result = await request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  accessToken = result.accessToken;
  return result.user;
}

export async function loginAccount(payload) {
  const result = await request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  accessToken = result.accessToken;
  return result.user;
}

export async function restoreSession() {
  try {
    const result = await request("/auth/refresh", { method: "POST" });
    accessToken = result.accessToken;
    return result.user;
  } catch (error) {
    if (error.status !== 401 && error.status !== 503) throw error;
    return null;
  }
}

export async function logoutAccount() {
  try { await request("/auth/logout", { method: "POST" }); } finally { accessToken = ""; }
}
