const paymentStatus = document.getElementById("paymentStatus");

const sessionId = new URLSearchParams(window.location.search).get("session_id");

console.log("checkout success script loaded");
console.log("Session:", sessionId);

if (!state.token) {
  window.location.href = "/auth.html";
}

const pollStatus = async (attempt = 1) => {
  if (!sessionId) {
    paymentStatus.textContent = "Missing session id.";
    return;
  }

  if (attempt > 6) {
    paymentStatus.textContent = "Timed out while checking payment.";
    return;
  }

  const data = await api(`/api/checkout/status/${sessionId}`);

  paymentStatus.textContent = `status=${data.status} | payment=${data.payment_status}`;

  if (data.payment_status === "paid") {
    paymentStatus.textContent = "Payment successful. Order created.";
    return;
  }

  setTimeout(() => pollStatus(attempt + 1), 2000);
};

ensureAuthNav();
pollStatus();