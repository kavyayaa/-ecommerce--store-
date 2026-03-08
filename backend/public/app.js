const state = {
  token: localStorage.getItem("lumos_token"),
  user: JSON.parse(localStorage.getItem("lumos_user") || "null")
};

const api = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

const setAuth = (token, user) => {
  state.token = token;
  state.user = user;
  localStorage.setItem("lumos_token", token);
  localStorage.setItem("lumos_user", JSON.stringify(user));
};

const clearAuth = () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem("lumos_token");
  localStorage.removeItem("lumos_user");
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const ensureAuthNav = () => {
  const authArea = document.querySelector('[data-testid="auth-nav-area"]');
  if (!authArea) return;

  if (!state.user) {
    authArea.innerHTML = `<a class="btn" href="/auth.html" data-testid="nav-login-link">Login / Signup</a>`;
    return;
  }

  const isAdmin = state.user.role === "admin";
  authArea.innerHTML = `
    <span data-testid="nav-user-email" class="muted">${state.user.email}</span>
    ${isAdmin ? '<a class="btn" href="/admin.html" data-testid="nav-admin-link">Admin</a>' : ""}
    <button class="btn" id="logoutBtn" data-testid="nav-logout-button">Logout</button>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      window.location.href = "/";
    });
  }
};
