import { clearSession, getSession } from "./authStorage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
};

export const request = async (endpoint, options = {}) => {
  const session = getSession();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization") && session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? safeParse(text) : null;

  if (response.status === 401 && session?.token) {
    clearSession();

    if (typeof window !== "undefined") {
      const fallbackPath = session.user?.role === "admin" ? "/admin/login" : "/login";
      if (window.location.pathname !== fallbackPath) {
        window.location.replace(fallbackPath);
      }
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};
