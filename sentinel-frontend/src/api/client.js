// Central API client. This is the ONLY place that knows the base URL.
// Preserves the existing /api proxy contract exactly (vite.config.js
// rewrites /api -> http://localhost:3000).

const API_URL = "/api";

export async function apiPost(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Sentinel request failed (${response.status}).`
    );
  }

  return data;
}

export async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Sentinel request failed (${response.status}).`
    );
  }

  return data;
}
