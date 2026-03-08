const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authStatus = document.getElementById("authStatus");

const setMode = (mode) => {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  loginTab.classList.toggle("btn-accent", isLogin);
  signupTab.classList.toggle("btn-accent", !isLogin);
};

loginTab.addEventListener("click", () => setMode("login"));
signupTab.addEventListener("click", () => setMode("signup"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authStatus.textContent = "Logging in...";
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value
      })
    });

    setAuth(data.token, data.user);
    authStatus.textContent = "Login successful";
    window.location.href = "/";
  } catch (error) {
    authStatus.textContent = error.message;
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authStatus.textContent = "Creating account...";
  try {
    const data = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("signupName").value,
        email: document.getElementById("signupEmail").value,
        password: document.getElementById("signupPassword").value
      })
    });

    setAuth(data.token, data.user);
    authStatus.textContent = "Signup successful";
    window.location.href = "/";
  } catch (error) {
    authStatus.textContent = error.message;
  }
});

if (state.token) {
  window.location.href = "/";
}
